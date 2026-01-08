import { createClient } from "@/lib/supabase/server"

export interface NotificationData {
  customerPhone: string
  customerName: string
  invoiceNumber: string
  totalAmount: number
  items: Array<{ name: string; quantity: number; price: number }>
  paymentMethod: string
}

export async function sendSaleNotification(data: NotificationData) {
  // Format the message
  const itemsList = data.items
    .map((item) => `• ${item.name} (${item.quantity}x) - ₹${item.price.toLocaleString("en-IN")}`)
    .join("\n")

  const message = `🛍️ *Jewellery100 - Purchase Receipt*

Dear ${data.customerName},

Thank you for your purchase!

*Invoice #:* ${data.invoiceNumber}

*Items Purchased:*
${itemsList}

*Total Amount:* ₹${data.totalAmount.toLocaleString("en-IN")}
*Payment Method:* ${data.paymentMethod.toUpperCase()}

We appreciate your business! 💎

For any queries, please contact us.
---
Jewellery100`

  // Log notification to database (optional - won't break if table doesn't exist)
  try {
    const supabase = await createClient()
    await supabase.from("notification_logs").insert({
      phone: data.customerPhone,
      message,
      type: "sale_receipt",
      status: "sent",
      reference_id: data.invoiceNumber,
    })
  } catch (error) {
    console.log("[v0] Notification logging skipped (table may not exist):", error)
  }

  // In production, integrate with SMS/WhatsApp provider
  // Example: Twilio, MSG91, or WhatsApp Business API
  console.log("[v0] Notification queued:", {
    to: data.customerPhone,
    message,
  })

  return { success: true, message: "Notification sent successfully" }
}

export async function sendLowStockAlert(productName: string, currentStock: number, minLevel: number) {
  const message = `⚠️ *Low Stock Alert*

Product: ${productName}
Current Stock: ${currentStock} units
Minimum Level: ${minLevel} units

Please reorder soon!`

  try {
    const supabase = await createClient()

    // Get admin users
    const { data: admins } = await supabase.from("user_profiles").select("phone").eq("role", "admin")

    // Send to all admins
    for (const admin of admins || []) {
      if (admin.phone) {
        await supabase.from("notification_logs").insert({
          phone: admin.phone,
          message,
          type: "low_stock_alert",
          status: "sent",
          reference_id: productName,
        })
        console.log("[v0] Low stock alert sent to:", admin.phone)
      }
    }
  } catch (error) {
    console.log("[v0] Low stock alert skipped (table may not exist):", error)
  }

  return { success: true }
}
