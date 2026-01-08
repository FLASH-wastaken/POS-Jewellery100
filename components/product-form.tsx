"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { X, Upload, ZoomIn, Loader2, Printer } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface Product {
  id?: string
  sku: string
  name: string
  description: string | null
  category: string
  metal_type: string | null
  purity: string | null
  weight_grams: number | null
  making_charges: number | null
  stone_charges: number | null
  price: number
  stock_quantity: number
  min_stock_level: number
  hallmark_number: string | null
  certificate_url: string | null
  image_url: string | null
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasVariants, setHasVariants] = useState(false)
  const [images, setImages] = useState<string[]>([])
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  const generateSKU = (category: string) => {
    const prefix = category.substring(0, 2).toUpperCase()
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")
    return `${prefix}-${timestamp}-${random}`
  }

  const generateBarcode = () => {
    return (
      Date.now().toString() +
      Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")
    )
  }

  const [formData, setFormData] = useState({
    sku: product?.sku || "",
    name: product?.name || "",
    description: product?.description || "",
    category: product?.category || "",
    supplier: "",
    warehouse: "",
    diamond_type: "",
    number_of_diamonds: 0,
    diamond_carat: "",
    metal_category: "",
    metal_color: "",
    gold_type: "",
    gold_weight: "",
    metal_type: product?.metal_type || "",
    purity: product?.purity || "",
    weight_grams: product?.weight_grams || 0,
    initial_quantity: product?.stock_quantity || 1,
    custom_text: "",
    barcode: "",
    item_note: product?.description || "",
    cost: product?.making_charges || 0,
    price: product?.price || 0,
    stock_quantity: product?.stock_quantity || 0,
    min_stock_level: product?.min_stock_level || 5,
  })

  useEffect(() => {
    if (!product && formData.category && !formData.sku) {
      setFormData((prev) => ({ ...prev, sku: generateSKU(formData.category) }))
    }
  }, [formData.category, product])

  useEffect(() => {
    if (!product && !formData.barcode) {
      setFormData((prev) => ({ ...prev, barcode: generateBarcode() }))
    }
  }, [product])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    Array.from(files).forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImages((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (!files) return

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImages((prev) => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      }
    })
  }

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError("You must be logged in")
      setIsLoading(false)
      return
    }

    try {
      const productData = {
        sku: formData.sku,
        name: formData.name,
        description: formData.item_note || formData.description,
        category: formData.category,
        metal_type: formData.metal_category || formData.metal_type,
        purity: formData.gold_type || formData.purity,
        weight_grams: Number(formData.gold_weight) || Number(formData.weight_grams),
        making_charges: Number(formData.cost),
        stone_charges: 0,
        price: Number(formData.price),
        stock_quantity: Number(formData.initial_quantity),
        min_stock_level: Number(formData.min_stock_level),
        hallmark_number: formData.custom_text,
        certificate_url: null,
        image_url: images[0] || null,
        created_by: user.id,
      }

      if (product?.id) {
        const { error } = await supabase.from("products").update(productData).eq("id", product.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from("products").insert(productData)
        if (error) throw error
      }

      router.push("/products")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit}>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 space-y-6">
            {/* Product Name, Category, Supplier, Warehouse */}
            <div className="grid gap-4 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Product name
                </Label>
                <Input
                  id="name"
                  placeholder="Product name"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Category
                </Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural-diamond">Natural Diamond</SelectItem>
                    <SelectItem value="lab-grown">Lab Grown</SelectItem>
                    <SelectItem value="pendants">Pendants</SelectItem>
                    <SelectItem value="bracelets">Bracelets</SelectItem>
                    <SelectItem value="rings-natural">Rings Natural</SelectItem>
                    <SelectItem value="bracelet-lab">Bracelet Lab</SelectItem>
                    <SelectItem value="earrings">Earrings</SelectItem>
                    <SelectItem value="studs-lab">Studs Lab</SelectItem>
                    <SelectItem value="bangle">Bangle</SelectItem>
                    <SelectItem value="semi-mount">Semi-Mount</SelectItem>
                    <SelectItem value="wedding-band">Wedding Band</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="supplier" className="text-sm font-medium">
                  Supplier
                </Label>
                <Select
                  value={formData.supplier}
                  onValueChange={(value) => setFormData({ ...formData, supplier: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viraj">Viraj International Inc.</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="warehouse" className="text-sm font-medium">
                  Warehouse
                </Label>
                <Select
                  value={formData.warehouse}
                  onValueChange={(value) => setFormData({ ...formData, warehouse: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="main">Main Warehouse</SelectItem>
                    <SelectItem value="store">Store</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Product Variants Toggle */}
            <div className="flex items-center gap-3 py-2">
              <Switch id="variants" checked={hasVariants} onCheckedChange={setHasVariants} />
              <Label htmlFor="variants" className="text-sm font-medium cursor-pointer">
                Product has variants?
              </Label>
            </div>

            {/* SKU - Auto-generated */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                SKU : <span className="text-primary font-semibold">{formData.sku || "N/A"}</span>
              </Label>
            </div>

            {/* Jewelry Details */}
            <div className="grid gap-4 lg:grid-cols-5">
              <div className="space-y-2">
                <Label htmlFor="diamond_type" className="text-sm font-medium">
                  Diamond Type
                </Label>
                <Select
                  value={formData.diamond_type}
                  onValueChange={(value) => setFormData({ ...formData, diamond_type: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="natural">Natural</SelectItem>
                    <SelectItem value="lab">Lab Grown</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="number_of_diamonds" className="text-sm font-medium">
                  Number of Diamonds
                </Label>
                <Input
                  id="number_of_diamonds"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={formData.number_of_diamonds}
                  onChange={(e) => setFormData({ ...formData, number_of_diamonds: Number(e.target.value) })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="diamond_carat" className="text-sm font-medium">
                  Diamond carat(Ct)
                </Label>
                <Input
                  id="diamond_carat"
                  type="number"
                  step="0.001"
                  placeholder="Diamond carat"
                  value={formData.diamond_carat}
                  onChange={(e) => setFormData({ ...formData, diamond_carat: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="metal_category" className="text-sm font-medium">
                  Metals
                </Label>
                <Select
                  value={formData.metal_category}
                  onValueChange={(value) => setFormData({ ...formData, metal_category: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                    <SelectItem value="mixed">Mixed Metals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="metal_color" className="text-sm font-medium">
                  Metal Color
                </Label>
                <Select
                  value={formData.metal_color}
                  onValueChange={(value) => setFormData({ ...formData, metal_color: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yellow">Yellow</SelectItem>
                    <SelectItem value="white">White</SelectItem>
                    <SelectItem value="rose">Rose</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Gold Type and Weight */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="gold_type" className="text-sm font-medium">
                  Gold/Metal Purity
                </Label>
                <Select
                  value={formData.gold_type}
                  onValueChange={(value) => setFormData({ ...formData, gold_type: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10K">10K</SelectItem>
                    <SelectItem value="14K">14K</SelectItem>
                    <SelectItem value="18K">18K</SelectItem>
                    <SelectItem value="22K">22K</SelectItem>
                    <SelectItem value="24K">24K</SelectItem>
                    <SelectItem value="925">925 (Sterling Silver)</SelectItem>
                    <SelectItem value="950">950 (Silver)</SelectItem>
                    <SelectItem value="PT950">PT950 (Platinum)</SelectItem>
                    <SelectItem value="PT999">PT999 (Platinum)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="gold_weight" className="text-sm font-medium">
                  Metal weight(Gr)
                </Label>
                <Input
                  id="gold_weight"
                  type="number"
                  step="0.001"
                  placeholder="Metal weight"
                  value={formData.gold_weight}
                  onChange={(e) => setFormData({ ...formData, gold_weight: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Quantity, Custom Text, Barcode */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="initial_quantity" className="text-sm font-medium">
                  Initial Quantity
                </Label>
                <Input
                  id="initial_quantity"
                  type="number"
                  min="0"
                  value={formData.initial_quantity}
                  onChange={(e) => setFormData({ ...formData, initial_quantity: Number(e.target.value) })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="custom_text" className="text-sm font-medium">
                  Custom text
                </Label>
                <Input
                  id="custom_text"
                  placeholder="Custom text"
                  value={formData.custom_text}
                  onChange={(e) => setFormData({ ...formData, custom_text: e.target.value })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="barcode" className="text-sm font-medium">
                  Barcode (optional)
                </Label>
                <Input
                  id="barcode"
                  placeholder="Barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Item Note, Cost, Price */}
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="item_note" className="text-sm font-medium">
                  Item note (optional)
                </Label>
                <Textarea
                  id="item_note"
                  placeholder="Note"
                  rows={1}
                  value={formData.item_note}
                  onChange={(e) => setFormData({ ...formData, item_note: e.target.value })}
                  className="resize-none"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost" className="text-sm font-medium">
                  Cost
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="Cost"
                  value={formData.cost}
                  onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-medium">
                  Price
                </Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  placeholder="Price"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                  className="h-11"
                />
              </div>
            </div>

            {/* Image Upload */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Product images/videos</Label>
              <div
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer bg-muted/5"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">Drag & drop images or videos here or click to select</p>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>

              {/* Image Preview Grid */}
              {images.length > 0 && (
                <div className="grid grid-cols-4 gap-3 mt-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={img || "/placeholder.svg"}
                        alt={`Product ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => setZoomImage(img)}
                          className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                        >
                          <ZoomIn className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="p-2 bg-white/90 rounded-full hover:bg-white transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Label Generation Section */}
            {product?.id && (
              <div className="border-t pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm font-medium">Label Generation</Label>
                    <p className="text-xs text-muted-foreground mt-1">Print barcode labels for this product</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push(`/label-generation?id=${product.id}`)}
                    className="gap-2"
                  >
                    <Printer className="h-4 w-4" />
                    Print Label
                  </Button>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive border border-destructive/20">
                {error}
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" size="lg" disabled={isLoading} className="min-w-[200px]">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Image Zoom Modal */}
      <Dialog open={!!zoomImage} onOpenChange={() => setZoomImage(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="relative aspect-square w-full">
            {zoomImage && (
              <img src={zoomImage || "/placeholder.svg"} alt="Zoomed" className="w-full h-full object-contain" />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
