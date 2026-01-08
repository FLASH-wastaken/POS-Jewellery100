"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Minus, Trash2, ShoppingCart, X, MessageCircle, Barcode } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import Image from "next/image"

interface Product {
  id: string
  sku: string
  name: string
  price: number
  stock_quantity: number
  category: string
  image_url: string | null
  metal_type: string | null
  purity: string | null
}

interface Customer {
  id: string
  full_name: string
  phone: string
  customer_code: string
  email: string | null
}

interface CartItem {
  product: Product
  quantity: number
  discount: number
}

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "rings", label: "Rings" },
  { value: "necklaces", label: "Necklaces" },
  { value: "earrings", label: "Earrings" },
  { value: "bracelets", label: "Bracelets" },
  { value: "pendants", label: "Pendants" },
  { value: "bangles", label: "Bangles" },
  { value: "chains", label: "Chains" },
]

export function POSInterface({
  products,
  customers,
  categoryCounts,
}: {
  products: Product[]
  customers: Customer[]
  categoryCounts: Record<string, number>
}) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [globalDiscount, setGlobalDiscount] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [sendWhatsApp, setSendWhatsApp] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [barcodeInput, setBarcodeInput] = useState("")

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Barcode scanner
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "Enter" && barcodeInput) {
        const product = products.find(
          (p) =>
            p.sku.toLowerCase() === barcodeInput.toLowerCase() ||
            p.name.toLowerCase().includes(barcodeInput.toLowerCase()),
        )
        if (product) {
          addToCart(product)
        }
        setBarcodeInput("")
      } else if (e.key.length === 1 && document.activeElement?.tagName !== "INPUT") {
        setBarcodeInput((prev) => prev + e.key)
      }
    }

    window.addEventListener("keypress", handleKeyPress)
    return () => window.removeEventListener("keypress", handleKeyPress)
  }, [barcodeInput, products])

  const addToCart = (product: Product, quantity = 1) => {
    const existing = cart.find((item) => item.product.id === product.id)
    if (existing) {
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock_quantity) }
            : item,
        ),
      )
    } else {
      setCart([...cart, { product, quantity, discount: 0 }])
    }
  }

  const updateQuantity = (productId: string, newQuantity: number) => {
    const item = cart.find((i) => i.product.id === productId)
    if (!item) return

    if (newQuantity <= 0) {
      setCart(cart.filter((i) => i.product.id !== productId))
    } else if (newQuantity <= item.product.stock_quantity) {
      setCart(cart.map((i) => (i.product.id === productId ? { ...i, quantity: newQuantity } : i)))
    }
  }

  const updateItemDiscount = (productId: string, discount: number) => {
    setCart(cart.map((i) => (i.product.id === productId ? { ...i, discount } : i)))
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((i) => i.product.id !== productId))
  }

  const clearCart = () => {
    setCart([])
    setGlobalDiscount(0)
    setSelectedCustomerId(null)
  }

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  const itemDiscounts = cart.reduce((sum, item) => sum + (item.product.price * item.quantity * item.discount) / 100, 0)
  const globalDiscountAmount = ((subtotal - itemDiscounts) * globalDiscount) / 100
  const totalDiscount = itemDiscounts + globalDiscountAmount
  const taxableAmount = subtotal - totalDiscount
  const taxAmount = (taxableAmount * 3) / 100
  const total = taxableAmount + taxAmount

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  const handleCheckout = async () => {
    if (cart.length === 0) return

    setIsLoading(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setIsLoading(false)
      return
    }

    try {
      const invoiceNumber = `INV-${Date.now()}`

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: selectedCustomerId,
          subtotal,
          discount_amount: totalDiscount,
          discount_percentage: globalDiscount,
          tax_amount: taxAmount,
          total_amount: total,
          payment_method: paymentMethod,
          payment_status: "completed",
          created_by: user.id,
        })
        .select()
        .single()

      if (saleError) throw saleError

      for (const item of cart) {
        await supabase.from("sale_items").insert({
          sale_id: sale.id,
          product_id: item.product.id,
          product_name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
        })

        await supabase
          .from("products")
          .update({ stock_quantity: item.product.stock_quantity - item.quantity })
          .eq("id", item.product.id)

        await supabase.from("inventory_logs").insert({
          product_id: item.product.id,
          change_type: "sold",
          quantity_change: -item.quantity,
          previous_quantity: item.product.stock_quantity,
          new_quantity: item.product.stock_quantity - item.quantity,
          reference_id: sale.id,
          created_by: user.id,
        })
      }

      if (sendWhatsApp && selectedCustomer?.phone) {
        await fetch("/api/notifications/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerPhone: selectedCustomer.phone,
            customerName: selectedCustomer.full_name,
            invoiceNumber,
            totalAmount: total,
            items: cart.map((i) => ({
              name: i.product.name,
              quantity: i.quantity,
              price: i.product.price * i.quantity,
            })),
            paymentMethod,
          }),
        })
      }

      router.push(`/sales/${sale.id}`)
      router.refresh()
    } catch (error) {
      console.log("[v0] Checkout error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-full gap-6">
      {/* Left side - Product grid */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Search and filters */}
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search or scan product..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 rounded-lg">
            <Barcode className="h-4 w-4" />
            <span>Scan ready</span>
          </div>
        </div>

        {/* Category chips */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {CATEGORIES.map((cat) => {
              const count = cat.value === "all" ? products.length : categoryCounts[cat.value] || 0
              return (
                <Button
                  key={cat.value}
                  variant={selectedCategory === cat.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.value)}
                  className="whitespace-nowrap"
                >
                  {cat.label}
                  <Badge variant="secondary" className="ml-2">
                    {count}
                  </Badge>
                </Button>
              )
            })}
          </div>
        </ScrollArea>

        {/* Product grid */}
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pb-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:shadow-lg transition-shadow p-3 relative group"
                onClick={() => addToCart(product)}
              >
                {product.stock_quantity <= 5 && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-xs">
                    Low
                  </Badge>
                )}
                <div className="aspect-square bg-muted rounded-lg mb-2 relative overflow-hidden">
                  {product.image_url ? (
                    <Image
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      <ShoppingCart className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="font-medium text-sm line-clamp-1">{product.name}</p>
                  <p className="text-xs text-muted-foreground">{product.sku}</p>
                  <div className="flex items-center justify-between">
                    <p className="text-base font-bold text-primary">₹{product.price.toLocaleString("en-IN")}</p>
                    <p className="text-xs text-muted-foreground">Stock: {product.stock_quantity}</p>
                  </div>
                  {product.metal_type && (
                    <p className="text-xs text-muted-foreground capitalize">
                      {product.metal_type} {product.purity}
                    </p>
                  )}
                </div>
                <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
                  <Plus className="h-8 w-8 text-primary" />
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Right side - Cart and checkout */}
      <Card className="w-[420px] flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-6 w-6" />
              Cart
            </h2>
            {cart.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearCart}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Customer selection */}
          <Select
            value={selectedCustomerId || "walk-in"}
            onValueChange={(v) => setSelectedCustomerId(v === "walk-in" ? null : v)}
          >
            <SelectTrigger className="h-10">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="walk-in">Walk-in Customer</SelectItem>
              {customers.map((customer) => (
                <SelectItem key={customer.id} value={customer.id}>
                  {customer.full_name} ({customer.phone})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedCustomer && (
            <div className="mt-3 flex items-center justify-between bg-muted rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span>WhatsApp Receipt</span>
              </div>
              <Switch checked={sendWhatsApp} onCheckedChange={setSendWhatsApp} />
            </div>
          )}
        </div>

        {/* Cart items */}
        <ScrollArea className="flex-1 p-6">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <ShoppingCart className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">Cart is empty</p>
              <p className="text-sm text-muted-foreground">Add items to start sale</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => removeFromCart(item.product.id)}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-transparent"
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock_quantity}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <p className="font-semibold">₹{(item.product.price * item.quantity).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Item Discount %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={item.discount}
                      onChange={(e) => updateItemDiscount(item.product.id, Number(e.target.value))}
                      className="h-7 w-20 text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Checkout section */}
        {cart.length > 0 && (
          <div className="p-6 border-t space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">Global Discount (%)</Label>
              <Input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={globalDiscount}
                onChange={(e) => setGlobalDiscount(Number(e.target.value))}
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="card">💳 Card</SelectItem>
                  <SelectItem value="upi">📱 UPI</SelectItem>
                  <SelectItem value="netbanking">🏦 Net Banking</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>₹{subtotal.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
              {totalDiscount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Total Discount</span>
                  <span>-₹{totalDiscount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax (3%)</span>
                <span>₹{taxAmount.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              </div>
            </div>

            <Separator />

            <div className="flex justify-between items-center text-2xl font-bold">
              <span>Payable</span>
              <span className="text-primary">₹{total.toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
            </div>

            <Button size="lg" className="w-full h-14 text-lg" onClick={handleCheckout} disabled={isLoading}>
              {isLoading ? "Processing..." : "Submit"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}
