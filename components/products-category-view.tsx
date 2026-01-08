/*
  PRODUCTS CATEGORY VIEW COMPONENT
  
  Displays products grouped by category with expand/collapse functionality
*/

"use client"

import { useState } from "react"
import { ChevronDown, Package } from "lucide-react"
import Link from "next/link"

const CATEGORIES = ["rings", "necklaces", "earrings", "bracelets", "pendants", "bangles", "chains", "other"]

export function ProductsCategoryView({ products }: { products: any[] }) {
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  // Group products by category
  const groupedProducts = CATEGORIES.reduce(
    (acc, category) => {
      acc[category] = products.filter((p) => p.category === category)
      return acc
    },
    {} as Record<string, any[]>,
  )

  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }))
  }

  return (
    <div className="space-y-3">
      {CATEGORIES.map((category) => {
        const categoryProducts = groupedProducts[category]
        if (categoryProducts.length === 0) return null

        return (
          <div key={category} className="border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCategory(category)}
              className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Package className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium capitalize">{category}</span>
                <span className="text-sm text-muted-foreground">({categoryProducts.length})</span>
              </div>
              <ChevronDown
                className={`h-4 w-4 transition-transform ${expandedCategories[category] ? "rotate-180" : ""}`}
              />
            </button>

            {expandedCategories[category] && (
              <div className="border-t p-4 space-y-2 bg-muted/30">
                {categoryProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="p-3 rounded hover:bg-muted/50 transition-colors cursor-pointer border">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">{product.sku}</p>
                        </div>
                        <p className="font-semibold">₹{product.price.toLocaleString("en-IN")}</p>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">Stock: {product.stock_quantity}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
