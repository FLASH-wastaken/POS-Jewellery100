"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Scan, Plus, Minus, Trash2, FileText, Receipt, CheckCircle, XCircle } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import Image from "next/image"

interface Product {
  id: string
  sku: string
  name: string
  category: string
  metal_type: string
  purity: string
  weight_grams: number
  price: number
  stock_quantity: number
  image_url: string
  barcode: string
  number_of_diamonds?: number
  total_diamond_carat?: number
}

interface Customer {
  id: string
  full_name: string
  phone: string
  email: string
  customer_code: string
}

interface CartItem extends Product {
  quantity: number
  itemDiscount: number // Add individual item discount percentage
  lineTotal: number
}

export function POSContent() {
  const [searchQuery, setSearchQuery] = useState("")
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [documentType, setDocumentType] = useState<"invoice" | "memo">("invoice")
  const [memoDays, setMemoDays] = useState(15)
  const [discount, setDiscount] = useState(0)
  const [tax, setTax] = useState(0)
  const [notes, setNotes] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [loading, setLoading] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "cheque" | "card" | "bank_transfer">("cash") // Add payment method state
  const [sendVia, setSendVia] = useState<"print" | "whatsapp" | "email" | "sms">("print") // Add send method state

  const supabase = createClient()

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const itemDiscountAmount = (item.price * item.quantity * item.itemDiscount) / 100
    return sum + (item.price * item.quantity - itemDiscountAmount)
  }, 0)
  const discountAmount = (subtotal * discount) / 100
  const taxAmount = ((subtotal - discountAmount) * tax) / 100
  const total = subtotal - discountAmount + taxAmount

  // Load products
  const loadProducts = useCallback(
    async (query = "") => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .or(`name.ilike.%${query}%,sku.ilike.%${query}%,barcode.ilike.%${query}%`)
        .gt("stock_quantity", 0)
        .limit(50)

      if (error) {
        console.error("Error loading products:", error)
        return
      }

      setProducts(data || [])
    },
    [supabase],
  )

  // Load customers
  const loadCustomers = useCallback(async () => {
    const { data, error } = await supabase.from("customers").select("*").order("full_name")

    if (error) {
      console.error("Error loading customers:", error)
      return
    }

    setCustomers(data || [])
  }, [supabase])

  useEffect(() => {
    loadProducts()
    loadCustomers()
  }, [loadProducts, loadCustomers])

  // Search products
  const handleSearch = (value: string) => {
    setSearchQuery(value)
    loadProducts(value)
  }

  // Barcode scan simulation
  const handleBarcodeScan = () => {
    setIsScanning(true)
    toast.info("Ready to scan barcode...")

    // Listen for barcode scanner input
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && searchQuery) {
        const product = products.find((p) => p.barcode === searchQuery || p.sku === searchQuery)
        if (product) {
          addToCart(product)
          setSearchQuery("")
        } else {
          toast.error("Product not found")
        }
        setIsScanning(false)
        document.removeEventListener("keypress", handleKeyPress)
      }
    }

    document.addEventListener("keypress", handleKeyPress)

    setTimeout(() => {
      setIsScanning(false)
      document.removeEventListener("keypress", handleKeyPress)
    }, 5000)
  }

  // Add to cart
  const addToCart = (product: Product) => {
    const existing = cart.find((item) => item.id === product.id)

    if (existing) {
      if (existing.quantity >= product.stock_quantity) {
        toast.error("Not enough stock available")
        return
      }
      setCart(
        cart.map((item) => {
          if (item.id === product.id) {
            const newQuantity = item.quantity + 1
            const itemDiscountAmount = (item.price * newQuantity * item.itemDiscount) / 100
            return {
              ...item,
              quantity: newQuantity,
              lineTotal: item.price * newQuantity - itemDiscountAmount,
            }
          }
          return item
        }),
      )
    } else {
      setCart([...cart, { ...product, quantity: 1, itemDiscount: 0, lineTotal: product.price }])
    }
    toast.success(`Added ${product.name} to cart`)
  }

  // Update quantity
  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart
        .map((item) => {
          if (item.id === productId) {
            const newQuantity = Math.max(0, Math.min(item.stock_quantity, item.quantity + delta))
            const itemDiscountAmount = (item.price * newQuantity * item.itemDiscount) / 100
            return {
              ...item,
              quantity: newQuantity,
              lineTotal: item.price * newQuantity - itemDiscountAmount,
            }
          }
          return item
        })
        .filter((item) => item.quantity > 0),
    )
  }

  // Remove from cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.id !== productId))
  }

  // Clear cart
  const clearCart = () => {
    setCart([])
    setDiscount(0)
    setTax(0)
    setNotes("")
    setSelectedCustomer(null)
  }

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) => {
        if (item.id === productId) {
          const itemDiscountAmount = (item.price * item.quantity * discount) / 100
          return {
            ...item,
            itemDiscount: discount,
            lineTotal: item.price * item.quantity - itemDiscountAmount,
          }
        }
        return item
      }),
    )
  }

  // Create invoice/memo
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty")
      return
    }

    if (!selectedCustomer) {
      toast.error("Please select a customer")
      return
    }

    if (documentType === "invoice" && !paymentMethod) {
      toast.error("Please select a payment method")
      return
    }

    setLoading(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Generate invoice/memo number
      const prefix = documentType === "memo" ? "MEM" : "INV"
      const timestamp = Date.now()
      const invoiceNumber = `${prefix}-${timestamp}`

      // Calculate memo due date
      const memoDueDate =
        documentType === "memo"
          ? new Date(Date.now() + memoDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
          : null

      // Create sale record
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: selectedCustomer.id,
          document_type: documentType,
          memo_status: documentType === "memo" ? "pending" : null,
          memo_due_date: memoDueDate,
          sale_date: new Date().toISOString(),
          subtotal,
          discount_percentage: discount,
          discount_amount: discountAmount,
          tax_amount: taxAmount,
          total_amount: total,
          payment_status: documentType === "memo" ? "pending" : "completed",
          payment_method: documentType === "memo" ? "pending" : paymentMethod,
          notes,
          created_by: user.id,
        })
        .select()
        .single()

      if (saleError) throw saleError

      const saleItems = cart.map((item) => ({
        sale_id: sale.id,
        product_id: item.id,
        product_name: item.name,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.price,
        discount_percentage: item.itemDiscount,
        total_price: item.lineTotal,
      }))

      const { error: itemsError } = await supabase.from("sale_items").insert(saleItems)

      if (itemsError) throw itemsError

      // Update inventory
      for (const item of cart) {
        const { error: inventoryError } = await supabase
          .from("products")
          .update({ stock_quantity: item.stock_quantity - item.quantity })
          .eq("id", item.id)

        if (inventoryError) throw inventoryError
      }

      toast.success(`${documentType === "memo" ? "Memo" : "Invoice"} created successfully!`)

      if (sendVia === "print") {
        window.open(`/pos/invoice/${sale.id}`, "_blank")
      } else if (sendVia === "whatsapp") {
        await sendInvoiceViaWhatsApp(sale.id, selectedCustomer.phone)
      } else if (sendVia === "email") {
        await sendInvoiceViaEmail(sale.id, selectedCustomer.email)
      } else if (sendVia === "sms") {
        await sendInvoiceViaSMS(sale.id, selectedCustomer.phone)
      }

      clearCart()
      loadProducts()
    } catch (error: any) {
      console.error("Checkout error:", error)
      toast.error(error.message || "Failed to create invoice")
    } finally {
      setLoading(false)
    }
  }

  const sendInvoiceViaWhatsApp = async (saleId: string, phone: string) => {
    const message = `Your invoice is ready! View it here: ${window.location.origin}/pos/invoice/${saleId}`
    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, "_blank")
    toast.success("Opening WhatsApp...")
  }

  const sendInvoiceViaEmail = async (saleId: string, email: string) => {
    try {
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId, email, method: "email" }),
      })
      if (response.ok) {
        toast.success("Invoice sent via email!")
      } else {
        toast.error("Failed to send email")
      }
    } catch (error) {
      toast.error("Failed to send email")
    }
  }

  const sendInvoiceViaSMS = async (saleId: string, phone: string) => {
    try {
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId, phone, method: "sms" }),
      })
      if (response.ok) {
        toast.success("Invoice sent via SMS!")
      } else {
        toast.error("Failed to send SMS")
      }
    } catch (error) {
      toast.error("Failed to send SMS")
    }
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Main Content - Product Selection */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b bg-card p-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search or scan product..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-12 h-12 text-lg"
              />
              <Button
                size="icon"
                variant={isScanning ? "default" : "ghost"}
                className="absolute right-1 top-1/2 -translate-y-1/2"
                onClick={handleBarcodeScan}
              >
                <Scan className="h-5 w-5" />
              </Button>
            </div>
            <Select value={documentType} onValueChange={(v: "invoice" | "memo") => setDocumentType(v)}>
              <SelectTrigger className="w-40 h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Invoice
                  </div>
                </SelectItem>
                <SelectItem value="memo">
                  <div className="flex items-center gap-2">
                    <Receipt className="h-4 w-4" />
                    Memo
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow overflow-hidden group"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square relative bg-muted">
                  {product.image_url ? (
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">No Image</div>
                  )}
                  {product.stock_quantity <= 5 && (
                    <Badge variant="destructive" className="absolute top-2 left-2">
                      Low Stock
                    </Badge>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2 mb-1">{product.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{product.sku}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">${product.price.toLocaleString()}</span>
                    <span className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Cart & Checkout */}
      <div className="w-[450px] border-l bg-card flex flex-col">
        <div className="p-4 border-b">
          <h2 className="text-2xl font-bold mb-4">Current {documentType === "memo" ? "Memo" : "Sale"}</h2>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label>Customer</Label>
            <Select
              value={selectedCustomer?.id}
              onValueChange={(id) => setSelectedCustomer(customers.find((c) => c.id === id) || null)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select customer..." />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.full_name} - {customer.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {documentType === "memo" && (
            <div className="mt-3 space-y-2">
              <Label>Memo Period (Days)</Label>
              <Input
                type="number"
                value={memoDays}
                onChange={(e) => setMemoDays(Number(e.target.value))}
                min={1}
                max={30}
              />
              <p className="text-xs text-muted-foreground">
                Due date: {new Date(Date.now() + memoDays * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Receipt className="h-16 w-16 mb-4 opacity-20" />
              <p>Cart is empty</p>
              <p className="text-sm">Scan or select products to add</p>
            </div>
          ) : (
            cart.map((item) => (
              <Card key={item.id} className="p-3">
                <div className="flex gap-3">
                  <div className="w-16 h-16 bg-muted rounded relative flex-shrink-0">
                    {item.image_url && (
                      <Image
                        src={item.image_url || "/placeholder.svg"}
                        alt={item.name}
                        fill
                        className="object-cover rounded"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm line-clamp-1">{item.name}</h4>
                    <p className="text-xs text-muted-foreground">{item.sku}</p>
                    <p className="text-sm font-semibold text-primary mt-1">${item.price.toFixed(2)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Label className="text-xs">Disc:</Label>
                      <Input
                        type="number"
                        value={item.itemDiscount}
                        onChange={(e) => updateItemDiscount(item.id, Number(e.target.value))}
                        min={0}
                        max={100}
                        className="h-7 w-16 text-xs"
                      />
                      <span className="text-xs">%</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => removeFromCart(item.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 bg-transparent"
                        onClick={() => updateQuantity(item.id, -1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-7 w-7 bg-transparent"
                        onClick={() => updateQuantity(item.id, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between text-sm">
                  <span className="text-muted-foreground">Line Total:</span>
                  <span className="font-semibold">${item.lineTotal.toFixed(2)}</span>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Totals & Actions */}
        <div className="border-t p-4 space-y-4">
          {documentType === "invoice" && (
            <div>
              <Label className="text-xs mb-2 block">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Discount (%)</Label>
              <Input
                type="number"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                min={0}
                max={100}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs">Tax (%)</Label>
              <Input
                type="number"
                value={tax}
                onChange={(e) => setTax(Number(e.target.value))}
                min={0}
                max={100}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount ({discount}%):</span>
                <span>-${discountAmount.toFixed(2)}</span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax ({tax}%):</span>
                <span className="font-medium">+${taxAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span className="text-primary">${total.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <Label className="text-xs mb-2 block">Send Invoice Via</Label>
            <Select value={sendVia} onValueChange={(v: any) => setSendVia(v)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="print">Print</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 bg-transparent"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button
              className="flex-1"
              onClick={handleCheckout}
              disabled={
                cart.length === 0 || !selectedCustomer || (documentType === "invoice" && !paymentMethod) || loading
              }
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              {documentType === "memo" ? "Create Memo" : "Create Invoice"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
