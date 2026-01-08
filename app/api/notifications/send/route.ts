import { NextResponse } from "next/server"
import { sendSaleNotification } from "@/lib/notifications"

export async function POST(request: Request) {
  try {
    const data = await request.json()

    await sendSaleNotification(data)

    return NextResponse.json({ success: true, message: "Notification sent successfully" })
  } catch (error) {
    console.error("[v0] Notification error:", error)
    return NextResponse.json({ success: false, error: "Failed to send notification" }, { status: 500 })
  }
}
