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

    const supabase = await createClient()
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Fetch today's sales
    const { data: todaySales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("sale_date", today.toISOString())

    const todayRevenue = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

    // Fetch yesterday's sales for comparison
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const { data: yesterdaySales } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("sale_date", yesterday.toISOString())
      .lt("sale_date", today.toISOString())

    const yesterdayRevenue = yesterdaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
    const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

    // Fetch product counts
    const { data: products } = await supabase.from("products").select("stock_quantity, min_stock_level")

    const lowStockProducts = products?.filter((p) => p.stock_quantity <= p.min_stock_level) || []

    // Fetch counts
    const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true })

    const { count: salesCount } = await supabase
      .from("sales")
      .select("*", { count: "exact", head: true })
      .gte("sale_date", today.toISOString())

    return NextResponse.json({
      todayRevenue,
      revenueChange,
      customerCount: customerCount || 0,
      salesCount: salesCount || 0,
      lowStockCount: lowStockProducts.length,
      totalProducts: products?.length || 0,
    })
  } catch (error) {
    console.error("[v0] Dashboard stats API error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 })
  }
}
