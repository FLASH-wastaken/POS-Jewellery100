/*
  PRODUCTS CUSTOMIZATION COMPONENT
  
  Settings for product view:
  - Toggle between category-wise and common view
  - Category-wise: Shows collapsible sections for each category
  - Common view: Shows all products in flat list
*/

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const CATEGORIES = ["rings", "necklaces", "earrings", "bracelets", "pendants", "bangles", "chains", "other"]

export function ProductsCustomization() {
  const [viewMode, setViewMode] = useState<"common" | "category">("common")
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Load user preference
    const savedMode = localStorage.getItem("products_view_mode") || "common"
    setViewMode(savedMode as "common" | "category")
  }, [])

  const handleSave = async () => {
    setIsSaving(true)
    try {
      localStorage.setItem("products_view_mode", viewMode)
      toast({
        title: "Success",
        description: "Product view preference saved",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save preference",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <CardTitle>Products Display Settings</CardTitle>
        <CardDescription>Choose how to view products in the inventory</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <label className="text-sm font-medium">View Mode</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => setViewMode("common")}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                viewMode === "common"
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-muted/30 hover:border-muted-foreground/30"
              }`}
            >
              <p className="font-medium text-sm">Common View</p>
              <p className="text-xs text-muted-foreground mt-1">Show all products in a single flat list</p>
            </button>

            <button
              onClick={() => setViewMode("category")}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                viewMode === "category"
                  ? "border-primary bg-primary/10"
                  : "border-muted bg-muted/30 hover:border-muted-foreground/30"
              }`}
            >
              <p className="font-medium text-sm">Category View</p>
              <p className="text-xs text-muted-foreground mt-1">Group products by category (Rings, Earrings, etc)</p>
            </button>
          </div>
        </div>

        {viewMode === "category" && (
          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <p className="text-xs text-blue-600 dark:text-blue-400">
              Categories will appear as collapsible sections that expand to show products
            </p>
          </div>
        )}

        <div className="space-y-3">
          <label className="text-sm font-medium">Available Categories</label>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Badge key={category} variant="outline" className="capitalize">
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Preferences"}
        </Button>
      </CardContent>
    </Card>
  )
}
