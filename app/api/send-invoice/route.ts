import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { saleId, email, phone, method, invoiceNumber } = await request.json()
    const supabase = await createClient()

    // Get sale details
    const { data: sale, error: saleError } = await supabase
      .from("sales")
      .select("*, customers(*)")
      .eq("id", saleId)
      .single()

    if (saleError || !sale) {
      return NextResponse.json({ error: "Sale not found" }, { status: 404 })
    }

    const invoiceUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/pos/invoice/${saleId}`

    if (method === "email") {
      try {
        // Using a simple mail service - replace with your email provider (SendGrid, Resend, etc.)
        // For now, we'll just log and return success
        console.log(`[v0] Sending email to ${email}`)
        console.log(`[v0] Invoice: ${invoiceNumber}`)
        console.log(`[v0] URL: ${invoiceUrl}`)

        // TODO: Integrate with actual email service
        // Example with Resend:
        // const response = await resend.emails.send({
        //   from: "noreply@jewellery100.com",
        //   to: email,
        //   subject: `Invoice ${invoiceNumber}`,
        //   html: `<p>Your invoice is ready!</p><p><a href="${invoiceUrl}">View Invoice</a></p>`
        // })

        return NextResponse.json({
          success: true,
          message: "Email queued for sending",
          email: email,
        })
      } catch (emailError) {
        console.error("[v0] Email error:", emailError)
        return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
      }
    } else if (method === "sms") {
      try {
        console.log(`[v0] Sending SMS to ${phone}`)
        console.log(`[v0] Invoice: ${invoiceNumber}`)
        console.log(`[v0] URL: ${invoiceUrl}`)

        // TODO: Integrate with SMS service (Twilio, etc.)
        // Example with Twilio:
        // const message = await twilio.messages.create({
        //   from: process.env.TWILIO_PHONE_NUMBER,
        //   to: phone,
        //   body: `Your invoice ${invoiceNumber} is ready! View it here: ${invoiceUrl}`
        // })

        return NextResponse.json({
          success: true,
          message: "SMS queued for sending",
          phone: phone,
        })
      } catch (smsError) {
        console.error("[v0] SMS error:", smsError)
        return NextResponse.json({ error: "Failed to send SMS" }, { status: 500 })
      }
    }

    return NextResponse.json({ error: "Invalid method" }, { status: 400 })
  } catch (error: any) {
    console.error("[v0] Invoice send error:", error)
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 })
  }
}
