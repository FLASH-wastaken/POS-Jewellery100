"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

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
  notes: string
  customers: {
    full_name: string
    phone: string
    email: string
    address: string
  } | null
  sale_items: Array<{
    product_name: string
    sku: string
    quantity: number
    unit_price: number
    total_price: number
  }>
}

export function InvoicePrint({ saleId }: { saleId: string }) {
  const [sale, setSale] = useState<Sale | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadSale()
  }, [saleId])

  const loadSale = async () => {
    try {
      const { data, error } = await supabase
        .from("sales")
        .select(`
          *,
          customers (full_name, phone, email, address),
          sale_items (*)
        `)
        .eq("id", saleId)
        .single()

      if (!error && data) {
        setSale(data as any)
      }
    } catch (err) {
      console.error("Error loading sale:", err)
    } finally {
      setLoading(false)
    }
  }

  const sendEmail = async () => {
    if (!sale) return
    setSending(true)
    try {
      const response = await fetch("/api/send-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          saleId: sale.id,
          customerEmail: sale.customers?.email,
          invoiceNumber: sale.invoice_number,
        }),
      })
      if (response.ok) {
        alert("Invoice sent successfully!")
      }
    } catch (error) {
      console.error("Error sending invoice:", error)
    } finally {
      setSending(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center">Loading invoice...</div>
  }

  if (!sale) {
    return <div className="p-8 text-center text-red-600">Invoice not found</div>
  }

  return (
    <div className="space-y-4">
      <button onClick={() => window.print()} className="px-4 py-2 bg-blue-500 text-white rounded">
        Print Invoice
      </button>
      <button
        onClick={sendEmail}
        disabled={sending}
        className="ml-2 px-4 py-2 bg-green-500 text-white rounded disabled:opacity-50"
      >
        {sending ? "Sending..." : "Send Email"}
      </button>

      <div className="p-8 bg-white border-2 border-gray-300 print:border-0 print:p-0">
        {/* Header */}
        <div className="mb-8 pb-4 border-b-2 border-gray-300">
          <h1 className="text-3xl font-bold">INVOICE</h1>
          <p className="text-gray-600 mt-2">Invoice #: {sale.invoice_number}</p>
          <p className="text-gray-600">Date: {new Date(sale.sale_date).toLocaleDateString()}</p>
        </div>

        {/* Customer Info */}
        {sale.customers && (
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold mb-2">BILL TO:</h3>
              <p className="font-semibold">{sale.customers.full_name}</p>
              <p className="text-sm text-gray-600">{sale.customers.address}</p>
              <p className="text-sm text-gray-600">{sale.customers.phone}</p>
              <p className="text-sm text-gray-600">{sale.customers.email}</p>
            </div>
          </div>
        )}

        {/* Items Table */}
        <div className="mb-8">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-300">
                <th className="text-left py-2 px-2">Item</th>
                <th className="text-center py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Unit Price</th>
                <th className="text-right py-2 px-2">Total</th>
              </tr>
            </thead>
            <tbody>
              {sale.sale_items.map((item, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-3 px-2">
                    <div className="font-semibold">{item.product_name}</div>
                    <div className="text-sm text-gray-600">SKU: {item.sku}</div>
                  </td>
                  <td className="text-center py-3 px-2">{item.quantity}</td>
                  <td className="text-right py-3 px-2">₹{item.unit_price.toFixed(2)}</td>
                  <td className="text-right py-3 px-2 font-semibold">₹{item.total_price.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="flex justify-end mb-8">
          <div className="w-64">
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Subtotal:</span>
              <span>₹{sale.subtotal.toFixed(2)}</span>
            </div>
            {sale.discount_amount > 0 && (
              <div className="flex justify-between py-2 border-b border-gray-200 text-red-600">
                <span>Discount ({sale.discount_percentage}%):</span>
                <span>-₹{sale.discount_amount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between py-2 border-b border-gray-200">
              <span>Tax:</span>
              <span>₹{sale.tax_amount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between py-2 text-lg font-bold">
              <span>Total:</span>
              <span>₹{sale.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {sale.notes && (
          <div className="border-t-2 border-gray-300 pt-4">
            <h4 className="font-bold mb-2">Notes:</h4>
            <p className="text-sm text-gray-700">{sale.notes}</p>
          </div>
        )}
      </div>
    </div>
  )
}
