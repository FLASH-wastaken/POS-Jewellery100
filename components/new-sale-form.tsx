"use client"

import type React from "react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Trash2, MessageCircle, Search } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"

interface Product {
  id: string
  sku: string
  name: string
  price: number
  stock_quantity: number
}

interface Customer {
  id: string
  full_name: string
  phone: string
  customer_code: string
}

interface CartItem {
  product: Product
  quantity: number
}

export function NewSaleForm({ products, customers }: { products: Product[]; customers: Customer[] }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cart, setCart] = useState<CartItem[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [selectedProductId, setSelectedProductId] = useState<string>("")
  const [quantity, setQuantity] = useState(1)
  const [discountPercentage, setDiscountPercentage] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [sendNotification, setSendNotification] = useState(true)
  const [productSearch, setProductSearch] = useState("")

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase()),
  )

  const addToCart = () => {
    const product = products.find((p) => p.id === selectedProductId)
    if (!product) return

    const existingItem = cart.find((item) => item.product.id === product.id)
    if (existingItem) {
      setCart(
        cart.map((item) => (item.product.id === product.id ? { ...item, quantity: item.quantity + quantity } : item)),
      )
    } else {
      setCart([...cart, { product, quantity }])
    }

    setSelectedProductId("")
    setQuantity(1)
  }

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId))
  }

  const calculateTotals = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
    const discountAmount = (subtotal * discountPercentage) / 100
    const taxAmount = ((subtotal - discountAmount) * 3) / 100 // 3% tax
    const total = subtotal - discountAmount + taxAmount

    return { subtotal, discountAmount, taxAmount, total }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (cart.length === 0) {
      setError("Please add at least one item to cart")
      return
    }

    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }

    try {
      const totals = calculateTotals()
      const invoiceNumber = `INV-${Date.now()}`

      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .insert({
          invoice_number: invoiceNumber,
          customer_id: selectedCustomerId,
          subtotal: totals.subtotal,
          discount_amount: totals.discountAmount,
          discount_percentage: discountPercentage,
          tax_amount: totals.taxAmount,
          total_amount: totals.total,
          payment_method: paymentMethod,
          payment_status: "completed",
          created_by: user.id,
        })
        .select()
        .single()

      if (saleError) throw saleError

      for (const item of cart) {
        const { error: itemError } = await supabase.from("sale_items").insert({
          sale_id: sale.id,
          product_id: item.product.id,
          product_name: item.product.name,
          sku: item.product.sku,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.product.price * item.quantity,
        })

        if (itemError) throw itemError

        const { error: stockError } = await supabase
          .from("products")
          .update({ stock_quantity: item.product.stock_quantity - item.quantity })
          .eq("id", item.product.id)

        if (stockError) throw stockError

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

      if (sendNotification && selectedCustomerId) {
        const customer = customers.find((c) => c.id === selectedCustomerId)
        if (customer && customer.phone) {
          await fetch("/api/notifications/send", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              customerPhone: customer.phone,
              customerName: customer.full_name,
              invoiceNumber: invoiceNumber,
              totalAmount: totals.total,
              items: cart.map((item) => ({
                name: item.product.name,
                quantity: item.quantity,
                price: item.product.price * item.quantity,
              })),
              paymentMethod,
            }),
          })
        }
      }

      router.push(`/sales/${sale.id}`)
      router.refresh()
    } catch (err) {
      console.log("[v0] Sale creation error:", err)
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const totals = calculateTotals()
  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId)

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Add Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name or SKU..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="flex gap-4">
              <div className="flex-1">
                <Label htmlFor="product">Product</Label>
                <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                  <SelectTrigger id="product">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredProducts.map((product) => (
                      <SelectItem key={product.id} value={product.id} disabled={product.stock_quantity === 0}>
                        <div className="flex items-center justify-between w-full gap-4">
                          <span>{product.name}</span>
                          <span className="text-muted-foreground text-xs">
                            ₹{product.price.toLocaleString("en-IN")} • Stock: {product.stock_quantity}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-28">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="flex items-end">
                <Button type="button" onClick={addToCart} disabled={!selectedProductId} size="lg">
                  <Plus className="h-4 w-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Cart</span>
              {cart.length > 0 && <Badge variant="secondary">{cart.length} items</Badge>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No items in cart</p>
                <p className="text-sm text-muted-foreground">Add products to start a sale</p>
              </div>
            ) : (
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-center">Qty</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cart.map((item) => (
                      <TableRow key={item.product.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">{item.product.sku}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">₹{item.product.price.toLocaleString("en-IN")}</TableCell>
                        <TableCell className="text-center font-medium">{item.quantity}</TableCell>
                        <TableCell className="text-right font-semibold">
                          ₹{(item.product.price * item.quantity).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="customer">Select Customer (Optional)</Label>
                <Select
                  value={selectedCustomerId || "none"}
                  onValueChange={(val) => setSelectedCustomerId(val === "none" ? null : val)}
                >
                  <SelectTrigger id="customer">
                    <SelectValue placeholder="Walk-in customer" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Walk-in customer</SelectItem>
                    {customers.map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.full_name} - {customer.phone}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer && (
                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <div className="text-sm">
                    <p className="font-medium">{selectedCustomer.full_name}</p>
                    <p className="text-muted-foreground">{selectedCustomer.phone}</p>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <Label htmlFor="notification" className="text-sm cursor-pointer">
                        Send receipt via WhatsApp
                      </Label>
                    </div>
                    <Switch id="notification" checked={sendNotification} onCheckedChange={setSendNotification} />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment_method">Payment Method</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment_method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">💵 Cash</SelectItem>
                  <SelectItem value="card">💳 Card</SelectItem>
                  <SelectItem value="upi">📱 UPI</SelectItem>
                  <SelectItem value="netbanking">🏦 Net Banking</SelectItem>
                  <SelectItem value="other">➕ Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="discount">Discount (%)</Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
              />
            </div>

            <div className="space-y-3 border-t pt-4 bg-muted/30 -mx-6 px-6 pb-4 rounded-b-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">₹{totals.subtotal.toLocaleString("en-IN")}</span>
              </div>
              {totals.discountAmount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({discountPercentage}%)</span>
                  <span className="font-medium">-₹{totals.discountAmount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (3%)</span>
                <span className="font-medium">₹{totals.taxAmount.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Total</span>
                <span className="text-primary">₹{totals.total.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full h-12 text-base" disabled={isLoading || cart.length === 0}>
              {isLoading ? "Processing..." : `Complete Sale - ₹${totals.total.toLocaleString("en-IN")}`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </form>
  )
}
