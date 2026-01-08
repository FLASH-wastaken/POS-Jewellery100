"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Printer, ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { InvoicePrint } from "@/components/invoice-print"

interface Sale {
  id: string
  invoice_number: string
  document_type: string
  sale_date: string
  memo_due_date: string | null
  subtotal: number
  discount_amount: number
  discount_percentage: number
  tax_amount: number
  total_amount: number
  payment_method: string
  payment_status: string
  customers: {
    full_name: string
    phone: string
    email: string
    address: string
  } | null
  sale_items: Array<{
    id: string
    product_name: string
    sku: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export default function SaleDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPrintModal, setShowPrintModal] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSale()
  }, [])

  const loadSale = async () => {
    try {
      const { id } = await params
      if (id === "new") {
        router.push("/dashboard")
        return
      }

      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customers (full_name, phone, email, address),
          sale_items (*)
        `)
        .eq("id", id)
        .single()

      if (error || !data) {
        router.push("/dashboard")
        return
      }

      setSale(data as any)
    } catch (err) {
      console.error("[v0] Error loading sale:", err)
      router.push("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading sale details...</p>
        </div>
      </div>
    )
  }

  if (!sale) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Sale not found</p>
      </div>
    )
  }

  return (
    <>
      <div className="max-w-4xl space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.back()}
              className="rounded-full glass-effect hover:glass-effect-strong transition-all duration-300"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold font-serif tracking-tight">Sale Details</h1>
              <p className="text-muted-foreground">Invoice #{sale.invoice_number}</p>
            </div>
          </div>
          <Button
            onClick={() => setShowPrintModal(true)}
            className="rounded-full glass-effect hover:glass-effect-strong transition-all duration-300"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Invoice
          </Button>
        </div>

        {/* Existing code */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {sale.customers ? (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{sale.customers.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="font-medium">{sale.customers.phone}</p>
                  </div>
                  {sale.customers.email && (
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{sale.customers.email}</p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Walk-in customer</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Date</p>
                <p className="font-medium">{new Date(sale.sale_date).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Payment Method</p>
                <p className="font-medium capitalize">{sale.payment_method}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={sale.payment_status === "completed" ? "default" : "secondary"} className="capitalize">
                  {sale.payment_status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sale.sale_items.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                  <div>
                    <p className="font-medium">{item.product_name}</p>
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} × ₹{Number(item.unit_price).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <p className="font-semibold">₹{Number(item.total_price).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2 border-t pt-4">
              <div className="flex justify-between text-sm">
                <span>Subtotal</span>
                <span>₹{Number(sale.subtotal).toLocaleString("en-IN")}</span>
              </div>
              {sale.discount_amount > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>Discount ({sale.discount_percentage}%)</span>
                  <span>-₹{Number(sale.discount_amount).toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>₹{Number(sale.tax_amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>₹{Number(sale.total_amount).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {showPrintModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
          <div className="w-full h-full overflow-auto">
            <div className="flex justify-end p-4 sticky top-0 z-10">
              <Button variant="outline" size="sm" onClick={() => setShowPrintModal(false)} className="rounded-full">
                Close
              </Button>
            </div>
            <InvoicePrint saleId={sale.id} />
          </div>
        </div>
      )}
    </>
  )
}
