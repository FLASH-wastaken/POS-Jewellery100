"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, CheckCircle, RotateCcw, Printer } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"

interface MemoDetails {
  id: string
  invoice_number: string
  document_type: string
  memo_status: string
  sale_date: string
  memo_due_date: string
  subtotal: number
  discount_amount: number
  tax_amount: number
  total_amount: number
  notes: string
  customers: {
    id: string
    full_name: string
    phone: string
    email: string
    address: string
  }
  sale_items: Array<{
    id: string
    product_id: string
    product_name: string
    sku: string
    quantity: number
    unit_price: number
    total_price: number
    products: {
      image_url: string
      stock_quantity: number
    }
  }>
}

export function MemoDetail({ memoId }: { memoId: string }) {
  const [memo, setMemo] = useState<MemoDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadMemo()
  }, [memoId])

  const loadMemo = async () => {
    const { data, error } = await supabase
      .from("sales")
      .select(
        `
        *,
        customers (full_name, phone, email, address, id),
        sale_items (
          *,
          products (image_url, stock_quantity)
        )
      `,
      )
      .eq("id", memoId)
      .single()

    if (error) {
      console.error("Error loading memo:", error)
      toast.error("Failed to load memo")
    } else {
      setMemo(data as any)
    }
    setLoading(false)
  }

  const convertToInvoice = async () => {
    if (!memo) return

    setActionLoading(true)
    try {
      const response = await fetch("/api/memos/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memoId: memo.id }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to convert memo")
      }

      toast.success("Memo converted to invoice successfully!")
      router.push(`/pos/invoice/${data.invoiceId}`)
    } catch (error: any) {
      console.error("Conversion error:", error)
      toast.error(error.message || "Failed to convert memo")
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  if (!memo) {
    return <div className="flex items-center justify-center h-screen">Memo not found</div>
  }

  const daysRemaining = Math.ceil((new Date(memo.memo_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/memos">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{memo.invoice_number}</h1>
            <p className="text-muted-foreground">
              Due in {daysRemaining} days • {new Date(memo.memo_due_date).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={memo.memo_status === "pending" ? "secondary" : "default"}>
            {memo.memo_status.toUpperCase()}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.open(`/pos/invoice/${memo.id}`, "_blank")}>
            <Printer className="h-4 w-4 mr-2" />
            Print
          </Button>
          <Link href={`/memos/${memo.id}/return`}>
            <Button variant="outline">
              <RotateCcw className="h-4 w-4 mr-2" />
              Process Return
            </Button>
          </Link>
          <Button onClick={convertToInvoice} disabled={actionLoading || memo.memo_status !== "pending"}>
            <CheckCircle className="h-4 w-4 mr-2" />
            Convert to Invoice
          </Button>
        </div>
      </div>

      {/* Customer Info */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Information</CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Name</p>
            <p className="font-semibold">{memo.customers.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Phone</p>
            <p className="font-semibold">{memo.customers.phone}</p>
          </div>
          {memo.customers.email && (
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-semibold">{memo.customers.email}</p>
            </div>
          )}
          {memo.customers.address && (
            <div>
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="font-semibold">{memo.customers.address}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items */}
      <Card>
        <CardHeader>
          <CardTitle>Memo Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {memo.sale_items.map((item) => (
              <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                <div className="w-20 h-20 bg-muted rounded relative flex-shrink-0">
                  {item.products.image_url && (
                    <Image
                      src={item.products.image_url || "/placeholder.svg"}
                      alt={item.product_name}
                      fill
                      className="object-cover rounded"
                    />
                  )}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">{item.product_name}</h4>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Unit Price</p>
                  <p className="font-semibold">${item.unit_price.toFixed(2)}</p>
                  <p className="text-lg font-bold text-primary mt-2">${item.total_price.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-6 border-t space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal:</span>
              <span className="font-semibold">${memo.subtotal.toFixed(2)}</span>
            </div>
            {memo.discount_amount > 0 && (
              <div className="flex justify-between text-red-600">
                <span>Discount:</span>
                <span>-${memo.discount_amount.toFixed(2)}</span>
              </div>
            )}
            {memo.tax_amount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax:</span>
                <span className="font-semibold">${memo.tax_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold pt-2 border-t">
              <span>Total:</span>
              <span className="text-primary">${memo.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {memo.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{memo.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
