"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Upload, X, Save, Loader2, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface GeneralSettingsData {
  id: string
  shop_logo_url: string | null
  app_url: string | null
  shop_name: string
  shop_phone: string | null
  shop_address: string | null
  stock_threshold_quantity: number
  force_security_pin: boolean
  allow_negative_quantity: boolean
}

export function GeneralSettings() {
  const [settings, setSettings] = useState<GeneralSettingsData | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [tableExists, setTableExists] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.from("general_settings").select("*").limit(1)

      if (error && (error.code === "42P01" || error.message.includes("does not exist"))) {
        // Table doesn't exist
        setTableExists(false)
        setErrorMessage("The general_settings table hasn't been created yet.")
        console.error("[v0] Table does not exist:", error.message)
      } else if (error && error.code === "PGRST116") {
        // Table exists but no data - create default settings
        try {
          const { data: newSettings, error: insertError } = await supabase
            .from("general_settings")
            .insert([{ shop_name: "My Shop" }])
            .select()
            .single()

          if (insertError) {
            // RLS policy issue
            setTableExists(false)
            setErrorMessage(`Permission error: ${insertError.message}`)
            console.error("[v0] Insert error:", insertError)
          } else if (newSettings) {
            setSettings(newSettings)
            setLogoPreview(newSettings.shop_logo_url)
            setTableExists(true)
          }
        } catch (insertErr) {
          setTableExists(false)
          setErrorMessage("Failed to create default settings")
          console.error("[v0] Failed to create default settings:", insertErr)
        }
      } else if (error) {
        // Other errors
        setTableExists(false)
        setErrorMessage(`Database error: ${error.message}`)
        console.error("[v0] Error loading settings:", error)
      } else if (data && data.length > 0) {
        // Data exists
        setSettings(data[0])
        setLogoPreview(data[0]?.shop_logo_url)
        setTableExists(true)
      } else {
        // Table exists but empty - create default
        try {
          const { data: newSettings, error: insertError } = await supabase
            .from("general_settings")
            .insert([{ shop_name: "My Shop" }])
            .select()
            .single()

          if (insertError) {
            setTableExists(false)
            setErrorMessage(`Permission error: ${insertError.message}`)
          } else if (newSettings) {
            setSettings(newSettings)
            setLogoPreview(newSettings.shop_logo_url)
            setTableExists(true)
          }
        } catch (insertErr) {
          setTableExists(false)
          setErrorMessage("Failed to initialize settings")
        }
      }
    } catch (error) {
      setTableExists(false)
      setErrorMessage(error instanceof Error ? error.message : "Unknown error occurred")
      console.error("[v0] Error loading settings:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "Logo must be less than 2MB",
        variant: "destructive",
      })
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      setLogoPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
    setLogoFile(file)
  }

  const handleRemoveLogo = () => {
    setLogoPreview(null)
    setLogoFile(null)
    if (settings) {
      setSettings({ ...settings, shop_logo_url: null })
    }
  }

  const handleSave = async () => {
    if (!settings) return

    setIsSaving(true)
    try {
      let logoUrl = settings.shop_logo_url

      if (logoFile) {
        const fileName = `shop-logo-${Date.now()}-${Math.random().toString(36).substring(7)}`
        const { data, error: uploadError } = await supabase.storage
          .from("general_settings")
          .upload(fileName, logoFile, { upsert: false })

        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from("general_settings").getPublicUrl(data.path)
        logoUrl = urlData.publicUrl
        setLogoFile(null)
      }

      const { error: updateError } = await supabase
        .from("general_settings")
        .update({
          shop_logo_url: logoUrl,
          app_url: settings.app_url,
          shop_name: settings.shop_name,
          shop_phone: settings.shop_phone,
          shop_address: settings.shop_address,
          stock_threshold_quantity: settings.stock_threshold_quantity,
          force_security_pin: settings.force_security_pin,
          allow_negative_quantity: settings.allow_negative_quantity,
        })
        .eq("id", settings.id)

      if (updateError) throw updateError

      toast({
        title: "Success",
        description: "Settings saved successfully",
      })

      await loadSettings()
    } catch (error) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save settings",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!tableExists) {
    return (
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure your shop information and preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="ml-2">
              <div className="font-semibold mb-2">Setup Required</div>
              <div className="text-sm space-y-2">
                <p>{errorMessage}</p>
                <p className="mt-3 font-medium">To set up General Settings, run this migration:</p>
                <div className="bg-black/50 p-3 rounded text-xs font-mono mt-2 overflow-x-auto">
                  scripts/007_create_general_settings_schema.sql
                </div>
                <p className="mt-2 text-xs">Once the migration is run, refresh this page.</p>
              </div>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Failed to load settings. Please try refreshing the page.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure your shop information and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Logo Section */}
          <div>
            <Label className="text-base font-medium mb-2 block">Shop Logo</Label>
            <p className="text-sm text-muted-foreground mb-4">(Recommended 500x500 px)</p>
            {logoPreview ? (
              <div className="border-2 border-white/10 rounded-lg p-4 flex flex-col items-center gap-4 w-fit">
                <img src={logoPreview || "/placeholder.svg"} alt="Logo preview" className="h-32 w-32 object-contain" />
                <Button type="button" variant="destructive" size="sm" onClick={handleRemoveLogo} className="gap-2">
                  <X className="h-4 w-4" />
                  Change/Remove
                </Button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-white/10 rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer block">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Click or drag to upload logo</p>
                <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 2MB</p>
                <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="border-t border-white/10 pt-6 space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="app_url">App URL</Label>
                <Input
                  id="app_url"
                  type="url"
                  value={settings.app_url || ""}
                  onChange={(e) => setSettings({ ...settings, app_url: e.target.value })}
                  placeholder="https://www.example.com"
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="shop_name">Shop/App Name</Label>
                <Input
                  id="shop_name"
                  value={settings.shop_name}
                  onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="shop_phone">Shop Phone</Label>
                <Input
                  id="shop_phone"
                  type="tel"
                  value={settings.shop_phone || ""}
                  onChange={(e) => setSettings({ ...settings, shop_phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <Label htmlFor="shop_address">Shop Address</Label>
              <Textarea
                id="shop_address"
                value={settings.shop_address || ""}
                onChange={(e) => setSettings({ ...settings, shop_address: e.target.value })}
                className="mt-1.5 min-h-20"
              />
            </div>

            {/* Stock & Security */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="stock_threshold">Stock Threshold Quantity</Label>
                <Input
                  id="stock_threshold"
                  type="number"
                  min="0"
                  value={settings.stock_threshold_quantity}
                  onChange={(e) =>
                    setSettings({ ...settings, stock_threshold_quantity: Number.parseInt(e.target.value) || 0 })
                  }
                  className="mt-1.5"
                />
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.force_security_pin}
                    onChange={(e) => setSettings({ ...settings, force_security_pin: e.target.checked })}
                    className="rounded border border-white/20"
                  />
                  <span className="text-sm font-medium">Force To improve Security</span>
                </label>
              </div>

              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allow_negative_quantity}
                    onChange={(e) => setSettings({ ...settings, allow_negative_quantity: e.target.checked })}
                    className="rounded border border-white/20"
                  />
                  <span className="text-sm font-medium">Allow to sell with negative quantity</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={isSaving} className="gap-2">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  )
}
