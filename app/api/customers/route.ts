import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyAccessToken } from "@/lib/auth/token"

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!verifyAccessToken(token)) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search")
    const limit = searchParams.get("limit") || "50"
    const offset = searchParams.get("offset") || "0"

    const supabase = await createClient()

    let query = supabase.from("customers").select("*", { count: "est" }).order("created_at", { ascending: false })

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data: customers, count } = await query.range(Number(offset), Number(offset) + Number(limit) - 1)

    return NextResponse.json({
      customers: customers || [],
      pagination: {
        total: count || 0,
        limit: Number(limit),
        offset: Number(offset),
      },
    })
  } catch (error) {
    console.error("[v0] Customers API error:", error)
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!verifyAccessToken(token)) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 })
    }

    const body = await request.json()
    const supabase = await createClient()

    const { data, error } = await supabase.from("customers").insert([body]).select().single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error("[v0] Create customer error:", error)
    return NextResponse.json({ error: "Failed to create customer" }, { status: 500 })
  }
}
