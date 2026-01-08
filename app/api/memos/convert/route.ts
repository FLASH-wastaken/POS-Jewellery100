import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    /* Get authenticated user and memo data */
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { memoId } = await req.json()

    /* Fetch the memo with all related data */
    const { data: memo, error: memoError } = await supabase
      .from("sales")
      .select(
        `
        *,
        customers (id, full_name, phone, email, address),
        sale_items (
          id,
          product_id,
          product_name,
          sku,
          quantity,
          unit_price,
          total_price
        )
      `,
      )
      .eq("id", memoId)
      .single()

    if (memoError || !memo) {
      return NextResponse.json({ error: "Memo not found" }, { status: 404 })
    }

    /* Create new invoice from memo */
    const { data: invoice, error: invoiceError } = await supabase
      .from("sales")
      .insert({
        invoice_number: memo.invoice_number.replace("MEM", "INV"),
        customer_id: memo.customers?.id || null,
        document_type: "invoice",
        converted_from_memo_id: memo.id,
        sale_date: new Date().toISOString(),
        subtotal: memo.subtotal,
        discount_amount: memo.discount_amount,
        tax_amount: memo.tax_amount,
        total_amount: memo.total_amount,
        payment_status: "paid",
        payment_method: "cash",
        notes: `Converted from memo ${memo.invoice_number}`,
        created_by: user.id,
      })
      .select()
      .single()

    if (invoiceError || !invoice) {
      return NextResponse.json({ error: "Failed to create invoice" }, { status: 500 })
    }

    /* Copy all sale items to new invoice */
    const invoiceItems = memo.sale_items.map((item: any) => ({
      sale_id: invoice.id,
      product_id: item.product_id,
      product_name: item.product_name,
      sku: item.sku,
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from("sale_items").insert(invoiceItems)

    if (itemsError) {
      return NextResponse.json({ error: "Failed to copy items" }, { status: 500 })
    }

    /* Update original memo status to confirmed */
    const { error: updateError } = await supabase.from("sales").update({ memo_status: "confirmed" }).eq("id", memo.id)

    if (updateError) {
      return NextResponse.json({ error: "Failed to update memo status" }, { status: 500 })
    }

    return NextResponse.json({ success: true, invoiceId: invoice.id })
  } catch (error: any) {
    console.error("Memo conversion error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
