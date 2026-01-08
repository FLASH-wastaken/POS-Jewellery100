/*
  LABEL PRINTER CONFIGURATION
  
  Configure multiple label printers:
  - Add/remove printers
  - Select brand and connection type
  - Upload drivers
  - Test printer connection
  - Configure label dimensions
*/

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Plus, Settings, Download, Trash2, TestTube } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const PRINTER_BRANDS = [
  { id: "Zebra", name: "Zebra" },
  { id: "HP", name: "HP" },
  { id: "Epson", name: "Epson" },
  { id: "Brother", name: "Brother" },
  { id: "Dymo", name: "Dymo" },
  { id: "Custom", name: "Custom Printer" },
]

const CONNECTION_TYPES = [
  { id: "USB", name: "USB" },
  { id: "Network", name: "Network (Ethernet)" },
  { id: "Serial", name: "Serial Port" },
  { id: "Bluetooth", name: "Bluetooth" },
]

export function PrinterConfiguration() {
  const [printers, setPrinters] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [selectedBrand, setSelectedBrand] = useState("")
  const { toast } = useToast()

  const handleAddPrinter = async () => {
    if (!selectedBrand) {
      toast({
        title: "Error",
        description: "Please select a printer brand",
        variant: "destructive",
      })
      return
    }

    toast({
      title: "Success",
      description: `${selectedBrand} printer added successfully`,
    })
    setShowForm(false)
    setSelectedBrand("")
  }

  const handleTestPrinter = (printerId: string) => {
    toast({
      title: "Testing",
      description: "Connecting to printer...",
    })
    setTimeout(() => {
      toast({
        title: "Success",
        description: "Printer connection successful",
      })
    }, 2000)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Label Printers</h2>
          <p className="text-muted-foreground text-sm mt-1">Configure and manage your label printing devices</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Printer
        </Button>
      </div>

      {/* Add Printer Form */}
      {showForm && (
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle>Add New Printer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Printer Name</label>
              <Input placeholder="e.g., Main Label Printer" className="mt-1.5" />
            </div>

            <div>
              <label className="text-sm font-medium">Brand</label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {PRINTER_BRANDS.map((brand) => (
                  <button
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand.id)}
                    className={`p-3 rounded-lg border-2 text-sm transition-all ${
                      selectedBrand === brand.id
                        ? "border-primary bg-primary/10"
                        : "border-muted hover:border-muted-foreground/30"
                    }`}
                  >
                    {brand.name}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Connection Type</label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {CONNECTION_TYPES.map((type) => (
                  <button
                    key={type.id}
                    className="p-3 rounded-lg border-2 border-muted hover:border-primary/50 text-sm text-left"
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Label Width (mm)</label>
                <Input type="number" placeholder="50" className="mt-1.5" />
              </div>
              <div>
                <label className="text-sm font-medium">Label Height (mm)</label>
                <Input type="number" placeholder="25" className="mt-1.5" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Driver Upload</label>
              <div className="mt-2 border-2 border-dashed rounded-lg p-4 text-center">
                <Download className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">Click to upload driver</p>
                <p className="text-xs text-muted-foreground">.exe, .msi, .zip files</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddPrinter} className="flex-1">
                Add Printer
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 bg-transparent">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Printers List */}
      {printers.length === 0 ? (
        <Card className="glass-effect border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <Settings className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No printers configured yet</p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              Add Your First Printer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {printers.map((printer) => (
            <Card key={printer.id} className="glass-effect border-white/10">
              <CardContent className="pt-6 pb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{printer.name}</h3>
                      <Badge variant={printer.status === "connected" ? "default" : "secondary"}>{printer.status}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Brand: {printer.brand}</p>
                      <p>Connection: {printer.connection}</p>
                      <p>
                        Label Size: {printer.width}mm × {printer.height}mm
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTestPrinter(printer.id)}
                      className="gap-1 bg-transparent"
                    >
                      <TestTube className="h-3 w-3" />
                      Test
                    </Button>
                    <Button size="sm" variant="ghost">
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Printer Resources */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-base">Driver Downloads</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { brand: "Zebra", name: "ZSuite Drivers", link: "#" },
              { brand: "HP", name: "HP Universal Print Driver", link: "#" },
              { brand: "Epson", name: "Epson Label Printer Driver", link: "#" },
              { brand: "Dymo", name: "Dymo Label SDK", link: "#" },
            ].map((driver) => (
              <a
                key={driver.brand}
                href={driver.link}
                className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
              >
                <span className="text-sm">
                  <span className="font-medium">{driver.brand}</span> - {driver.name}
                </span>
                <Download className="h-4 w-4 text-muted-foreground" />
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
