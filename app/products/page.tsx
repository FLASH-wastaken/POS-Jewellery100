import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Search, Upload, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ProductsTable } from "@/components/products-table"
import { ProductsCategoryView } from "@/components/products-category-view"
import Link from "next/link"

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string; view?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase.from("products").select("*").order("created_at", { ascending: false })

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`)
  }

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category)
  }

  const { data: products } = await query

  const viewMode = params.view === "category" ? "category" : "common"

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Products</h1>
          <p className="text-muted-foreground">Manage your jewelry inventory</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="gap-2 glass-effect bg-transparent">
            <Link href="/settings/bulk-import">
              <Upload className="h-4 w-4" />
              Import
            </Link>
          </Button>
          <Button variant="outline" className="gap-2 glass-effect bg-transparent">
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button asChild className="gap-2">
            <Link href="/products/new">
              <Plus className="h-4 w-4" />
              Add Product
            </Link>
          </Button>
        </div>
      </div>

      <Card className="glass-effect border-white/20 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Product Inventory</CardTitle>
            <div className="flex gap-2">
              <Button
                asChild
                variant={viewMode === "common" ? "default" : "outline"}
                size="sm"
                className="text-xs bg-transparent"
              >
                <Link href="/products?view=common">Common View</Link>
              </Button>
              <Button
                asChild
                variant={viewMode === "category" ? "default" : "outline"}
                size="sm"
                className="text-xs bg-transparent"
              >
                <Link href="/products?view=category">Category View</Link>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search products by name or SKU..." className="pl-10" defaultValue={params.search} />
            </div>
          </div>

          {viewMode === "category" ? (
            <ProductsCategoryView products={products || []} />
          ) : (
            <ProductsTable products={products || []} />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
