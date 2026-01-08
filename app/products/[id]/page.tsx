import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Printer, ArrowLeft, Package, Gem, Weight, FileText } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: product } = await supabase.from("products").select("*").eq("id", id).single()

  if (!product) {
    notFound()
  }

  // Parse images if stored as JSON string
  const images = product.images
    ? typeof product.images === "string"
      ? JSON.parse(product.images)
      : product.images
    : []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/products">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold font-serif tracking-tight">{product.name}</h1>
            <p className="text-muted-foreground">SKU: {product.sku}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/label-generation?id=${product.id}`}>
              <Printer className="mr-2 h-4 w-4" />
              Print Label
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/products/${product.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Product
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Images Section */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Product Images
            </CardTitle>
          </CardHeader>
          <CardContent>
            {images.length > 0 ? (
              <div className="space-y-4">
                <div className="relative aspect-square overflow-hidden rounded-lg border bg-muted">
                  <Image
                    src={images[0] || "/placeholder.svg"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                {images.length > 1 && (
                  <div className="grid grid-cols-3 gap-2">
                    {images.slice(1, 4).map((img: string, idx: number) => (
                      <div key={idx} className="relative aspect-square overflow-hidden rounded-md border bg-muted">
                        <Image
                          src={img || "/placeholder.svg"}
                          alt={`${product.name} ${idx + 2}`}
                          fill
                          className="object-cover"
                          sizes="100px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex aspect-square items-center justify-center rounded-lg border-2 border-dashed bg-muted">
                <div className="text-center">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No images</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Details Section */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Category</p>
                <Badge variant="secondary" className="mt-1 capitalize">
                  {product.category}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Barcode</p>
                <p className="mt-1 font-mono text-sm">{product.barcode || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stock Quantity</p>
                <p className="mt-1 text-lg font-semibold">{product.stock_quantity}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Min Stock Level</p>
                <p className="mt-1 text-lg font-semibold">{product.min_stock_level}</p>
              </div>
            </CardContent>
          </Card>

          {/* Jewelry Specifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gem className="h-5 w-5" />
                Jewelry Specifications
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Metal Type</p>
                <p className="mt-1 capitalize">{product.metal_type || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Metal Purity</p>
                <p className="mt-1">{product.metal_purity || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Weight (grams)</p>
                <p className="mt-1 font-semibold">{product.weight_grams ? `${product.weight_grams}g` : "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Diamond Type</p>
                <p className="mt-1 capitalize">{product.diamond_type || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Number of Diamonds</p>
                <p className="mt-1">{product.num_diamonds || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Diamond Carat</p>
                <p className="mt-1">{product.diamond_carat ? `${product.diamond_carat}ct` : "N/A"}</p>
              </div>
              {product.custom_text && (
                <div className="sm:col-span-2">
                  <p className="text-sm font-medium text-muted-foreground">Custom Text</p>
                  <p className="mt-1">{product.custom_text}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Weight className="h-5 w-5" />
                Pricing & Costs
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Price</p>
                <p className="mt-1 text-lg font-semibold">₹{product.cost_price?.toLocaleString("en-IN") || "0"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selling Price</p>
                <p className="mt-1 text-2xl font-bold text-primary">₹{product.price.toLocaleString("en-IN")}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm font-medium text-muted-foreground">Profit Margin</p>
                <p className="mt-1 text-lg font-semibold text-green-600">
                  ₹{(product.price - (product.cost_price || 0)).toLocaleString("en-IN")} (
                  {product.cost_price
                    ? (((product.price - product.cost_price) / product.cost_price) * 100).toFixed(1)
                    : "0"}
                  %)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {product.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{product.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
