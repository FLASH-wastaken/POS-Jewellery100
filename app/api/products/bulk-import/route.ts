import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { verifyAccessToken } from "@/lib/auth/token"

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("accessToken")?.value
    if (!token || !verifyAccessToken(token)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let products: Record<string, unknown>[] = []
    try {
      const body = await request.json()
      products = body.products || []
    } catch (parseError) {
      const errMsg = parseError instanceof Error ? parseError.message : "Failed to parse JSON"
      return NextResponse.json({ error: `Request parse error: ${errMsg}` }, { status: 400 })
    }

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products to import" }, { status: 400 })
    }

    let supabase
    try {
      supabase = await createClient()
    } catch (clientError) {
      const errMsg = clientError instanceof Error ? clientError.message : "Failed to create Supabase client"
      return NextResponse.json({ error: `Database connection error: ${errMsg}` }, { status: 500 })
    }

    let successCount = 0
    let failCount = 0
    const errors: string[] = []
    let barcodeSequence = 100001

    for (const product of products) {
      try {
        const name = String(product.name || "").trim()
        if (!name) {
          failCount++
          errors.push("Skipped: Missing product name")
          continue
        }

        const price = Number.parseFloat(String(product.price || 0))
        if (isNaN(price) || price <= 0) {
          failCount++
          errors.push(`"${name}": Price must be a valid number`)
          continue
        }

        const productData: Record<string, unknown> = {
          sku: `SKU-${barcodeSequence}`,
          name: name,
          price: price,
          category: "rings", // Default category
          stock_quantity: 0,
          is_custom_order: false,
        }

        // Map gold_weight → weight_grams
        const goldWeight = Number.parseFloat(String(product.gold_weight || 0))
        if (!isNaN(goldWeight) && goldWeight > 0) {
          productData.weight_grams = goldWeight
        }

        // Map cost → making_charges
        const cost = Number.parseFloat(String(product.cost || 0))
        if (!isNaN(cost) && cost > 0) {
          productData.making_charges = cost
        }

        // Map diamond_carat → stone_charges (multiply by 5000 for valuation)
        const diamondCarat = Number.parseFloat(String(product.diamond_carat || 0))
        if (!isNaN(diamondCarat) && diamondCarat > 0) {
          productData.stone_charges = diamondCarat * 5000
        }

        // Map gold_type → purity
        const goldType = String(product.gold_type || "").trim()
        if (goldType) {
          productData.purity = goldType
        }

        // Map metal_type or default to gold
        productData.metal_type = String(product.metal_type || "gold").trim()

        // Combine diamond clarity and color into description
        const clarity = String(product["diamond clarity"] || "").trim()
        const color = String(product["diamond color"] || "").trim()
        const description = [clarity, color].filter(Boolean).join(" - ")
        if (description) {
          productData.description = description
        }

        barcodeSequence++

        const { data, error } = await supabase.from("products").insert([productData]).select()

        if (error) {
          failCount++
          errors.push(`"${name}": ${error.message}`)
        } else if (data && data.length > 0) {
          successCount++
        } else {
          failCount++
          errors.push(`"${name}": Insert failed`)
        }
      } catch (err) {
        failCount++
        const productName = product.name ? String(product.name) : "Unknown"
        const errMsg = err instanceof Error ? err.message : "Unknown error"
        errors.push(`"${productName}": ${errMsg}`)
      }
    }

    return NextResponse.json({
      success: successCount,
      failed: failCount,
      errors: errors.slice(0, 10), // Limit errors shown to first 10
      total: products.length,
      message: `Imported ${successCount}/${products.length} products`,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Bulk import failed"
    return NextResponse.json({ error: errorMessage, success: 0, failed: 0, errors: [errorMessage] }, { status: 500 })
  }
}
