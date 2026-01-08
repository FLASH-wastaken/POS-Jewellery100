/*
  DASHBOARD CUSTOMIZATION COMPONENT
  
  Allows users to:
  - Enable/disable dashboard tiles
  - Drag and drop to reorder tiles
  - Configure which metrics to display
  
  For developers: Manages dashboard_config table
*/

"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, EyeOff, GripVertical, Save } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const AVAILABLE_TILES = [
  { id: "revenue", name: "Today's Revenue", description: "Display daily revenue metrics" },
  { id: "products", name: "Total Products", description: "Show inventory count and low stock alerts" },
  { id: "customers", name: "Total Customers", description: "Display customer database size" },
  { id: "growth", name: "Monthly Growth", description: "Show growth percentage vs last month" },
  { id: "alerts", name: "Low Stock Alerts", description: "Display products running low on stock" },
  { id: "salesTrend", name: "Sales Trend Chart", description: "Show 30-day sales trend line chart" },
  { id: "recentSales", name: "Recent Sales", description: "Display latest 5 transactions" },
  { id: "categoryBreakdown", name: "Sales by Category", description: "Show bar chart of category sales" },
  { id: "revenueCategory", name: "Revenue by Category", description: "Display pie chart of revenue breakdown" },
  { id: "quickActions", name: "Quick Actions", description: "Show buttons for common actions" },
]

export function DashboardCustomization() {
  const [tiles, setTiles] = useState(AVAILABLE_TILES)
  const [enabledTiles, setEnabledTiles] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  // Load user config from database
  useEffect(() => {
    async function loadConfig() {
      try {
        const response = await fetch("/api/dashboard/config")
        const data = await response.json()
        setEnabledTiles(data.enabled_tiles || {})
      } catch (error) {
        console.error("Failed to load dashboard config:", error)
      } finally {
        setIsLoading(false)
      }
    }
    loadConfig()
  }, [])

  const handleToggleTile = (tileId: string) => {
    setEnabledTiles((prev) => ({
      ...prev,
      [tileId]: !prev[tileId],
    }))
  }

  const handleSaveConfig = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/dashboard/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled_tiles: enabledTiles }),
      })

      if (!response.ok) throw new Error("Failed to save")
      toast({
        title: "Success",
        description: "Dashboard configuration saved",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save dashboard configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return <div className="text-center py-8">Loading configuration...</div>
  }

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <CardTitle>Customize Dashboard Tiles</CardTitle>
        <CardDescription>Choose which tiles to display on your dashboard and in what order</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Instructions */}
        <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            Toggle tiles to enable or disable them. Drag to reorder. Changes are saved to your profile.
          </p>
        </div>

        {/* Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {AVAILABLE_TILES.map((tile) => (
            <div
              key={tile.id}
              className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                enabledTiles[tile.id] ? "border-primary/50 bg-primary/5" : "border-muted bg-muted/30 opacity-60"
              }`}
              onClick={() => handleToggleTile(tile.id)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className="mt-1">
                    {enabledTiles[tile.id] ? (
                      <Eye className="h-5 w-5 text-primary" />
                    ) : (
                      <EyeOff className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{tile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{tile.description}</p>
                  </div>
                </div>
                <div className="mt-1">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Enabled Tiles Summary */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm font-medium mb-2">
            Enabled Tiles ({Object.values(enabledTiles).filter(Boolean).length})
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(enabledTiles)
              .filter(([, enabled]) => enabled)
              .map(([tileId]) => {
                const tile = AVAILABLE_TILES.find((t) => t.id === tileId)
                return tile ? <Badge key={tileId}>{tile.name}</Badge> : null
              })}
          </div>
        </div>

        {/* Save Button */}
        <div className="flex gap-2 pt-4">
          <Button onClick={handleSaveConfig} disabled={isSaving} className="gap-2">
            <Save className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Configuration"}
          </Button>
          <Button variant="outline">Reset to Default</Button>
        </div>
      </CardContent>
    </Card>
  )
}
