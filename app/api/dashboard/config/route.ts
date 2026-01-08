/*
  DASHBOARD CONFIG API
  
  GET: Retrieve user's dashboard configuration
  POST: Save user's dashboard configuration
  
  For developers: Manages dashboard_config table
*/

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create dashboard config
    const { data: configs } = await supabase.from("dashboard_config").select("*").eq("user_id", user.id)

    let config = configs && configs.length > 0 ? configs[0] : null

    if (!config) {
      // Create default config
      const { data: newConfig } = await supabase
        .from("dashboard_config")
        .insert({
          user_id: user.id,
          enabled_tiles: {
            revenue: true,
            products: true,
            customers: true,
            growth: true,
            alerts: true,
            salesTrend: true,
            recentSales: true,
            categoryBreakdown: true,
            revenueCategory: true,
            quickActions: true,
          },
        })
        .select()
        .single()

      config = newConfig
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error("[v0] Dashboard config error:", error)
    return NextResponse.json({ error: "Failed to fetch config" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { enabled_tiles, tile_order } = body

    // Update config
    const { data, error } = await supabase
      .from("dashboard_config")
      .upsert({
        user_id: user.id,
        enabled_tiles,
        tile_order: tile_order || undefined,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data)
  } catch (error) {
    console.error("[v0] Dashboard config save error:", error)
    return NextResponse.json({ error: "Failed to save config" }, { status: 500 })
  }
}
