/*
  INVOICE CUSTOMIZATION SETTINGS
  
  Configure:
  - Company branding (logo, signature)
  - Invoice fonts and styling
  - Header and footer text
  - QR codes and messaging
  - Terms and conditions
*/

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Upload, Save, Eye } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function InvoiceCustomization() {
  const [config, setConfig] = useState({
    company_name: "Jewellery100",
    company_phone: "",
    company_email: "",
    company_address: "",
    invoice_font: "Arial",
    header_text: "",
    footer_text: "",
    show_qr_code: true,
    thank_you_message: "Thank you for your business!",
  })
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const response = await fetch("/api/invoice/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      })

      if (!response.ok) throw new Error("Failed to save")
      toast({
        title: "Success",
        description: "Invoice configuration saved",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save configuration",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Company Branding */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle>Company Branding</CardTitle>
          <CardDescription>Upload your company logo and signature</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <label className="text-sm font-medium">Company Logo</label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm">Click or drag to upload logo</p>
              <p className="text-xs text-muted-foreground">PNG, JPG up to 2MB</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Signature</label>
            <div className="mt-2 border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors cursor-pointer">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm">Click or drag to upload signature</p>
              <p className="text-xs text-muted-foreground">PNG with transparent background</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                value={config.company_phone}
                onChange={(e) => setConfig({ ...config, company_phone: e.target.value })}
                className="mt-1.5"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                value={config.company_email}
                onChange={(e) => setConfig({ ...config, company_email: e.target.value })}
                className="mt-1.5"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Address</label>
            <Textarea
              value={config.company_address}
              onChange={(e) => setConfig({ ...config, company_address: e.target.value })}
              className="mt-1.5 min-h-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoice Formatting */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle>Invoice Formatting</CardTitle>
          <CardDescription>Customize fonts and layout</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Font Family</label>
            <select
              value={config.invoice_font}
              onChange={(e) => setConfig({ ...config, invoice_font: e.target.value })}
              className="w-full p-2 rounded-lg border border-white/10 bg-muted/50 mt-1.5 text-sm"
            >
              <option>Arial</option>
              <option>Times New Roman</option>
              <option>Courier</option>
              <option>Calibri</option>
              <option>Georgia</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Header Text</label>
            <Textarea
              value={config.header_text}
              onChange={(e) => setConfig({ ...config, header_text: e.target.value })}
              className="mt-1.5 min-h-20"
              placeholder="Optional text to appear at the top of invoices"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Footer Text</label>
            <Textarea
              value={config.footer_text}
              onChange={(e) => setConfig({ ...config, footer_text: e.target.value })}
              className="mt-1.5 min-h-20"
              placeholder="Optional text to appear at the bottom of invoices"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Thank You Message</label>
            <Input
              value={config.thank_you_message}
              onChange={(e) => setConfig({ ...config, thank_you_message: e.target.value })}
              className="mt-1.5"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.show_qr_code}
              onChange={(e) => setConfig({ ...config, show_qr_code: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium">Show QR code on invoice</span>
          </label>
        </CardContent>
      </Card>

      {/* Terms and Conditions */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle>Terms & Conditions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Terms Text</label>
            <Textarea className="mt-1.5 min-h-24" placeholder="Your terms and conditions to appear on invoices" />
          </div>
        </CardContent>
      </Card>

      {/* Preview and Save */}
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2 flex-1 bg-transparent">
          <Eye className="h-4 w-4" />
          Preview Invoice
        </Button>
        <Button onClick={handleSave} disabled={isSaving} className="gap-2 flex-1">
          <Save className="h-4 w-4" />
          {isSaving ? "Saving..." : "Save Configuration"}
        </Button>
      </div>
    </div>
  )
}
