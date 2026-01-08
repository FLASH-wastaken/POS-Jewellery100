"use client"

import type React from "react"

import { useSearchParams } from "next/navigation"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Printer, Download, Move } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { createClient } from "@/lib/supabase/client"

export function LabelGenerationContent() {
  const searchParams = useSearchParams()
  const productId = searchParams.get("id")

  const [config, setConfig] = useState({
    labelStyle: "style1",
    paperWidth: 85,
    paperHeight: 25,
    fontSize: 8,
  })

  const [product, setProduct] = useState<any>(null)
  const [draggingElement, setDraggingElement] = useState<string | null>(null)
  const [elementPositions, setElementPositions] = useState({
    barcode: { x: 0, y: 0 },
    details: { x: 0, y: 0 },
  })
  const labelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (productId) {
      loadProduct(productId)
    }
  }, [productId])

  const loadProduct = async (id: string) => {
    const supabase = createClient()
    const { data } = await supabase.from("products").select("*").eq("id", id).single()

    if (data) setProduct(data)
  }

  const handlePrint = () => {
    const printWindow = window.open("", "", "width=400,height=300")
    if (labelRef.current && printWindow) {
      const labelHTML = labelRef.current.innerHTML
      printWindow.document.write(`
        <html>
          <head>
            <style>
              body { margin: 0; padding: 10px; }
              @media print { 
                body { margin: 0; }
                .print-label { page-break-after: auto; }
              }
            </style>
          </head>
          <body>
            <div class="print-label">${labelHTML}</div>
          </body>
        </html>
      `)
      printWindow.document.close()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  const handleMouseDown = (e: React.MouseEvent, element: string) => {
    if ((e.target as HTMLElement).closest('[data-draggable="true"]')) {
      setDraggingElement(element)
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!draggingElement || !labelRef.current) return

    const rect = labelRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setElementPositions((prev) => ({
      ...prev,
      [draggingElement]: { x, y },
    }))
  }

  const handleMouseUp = () => {
    setDraggingElement(null)
  }

  return (
    <div className="min-h-screen bg-background p-6 animate-fade-in-up">
      <div className="mx-auto max-w-7xl">
        <h1 className="mb-6 text-3xl font-bold">Label Generation</h1>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Configuration Panel */}
          <Card className="p-6 glass-effect">
            <h2 className="mb-4 text-xl font-semibold">Label Configuration</h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label-style" className="text-sm font-medium">
                  Label Style
                </Label>
                <Select
                  value={config.labelStyle}
                  onValueChange={(value) => setConfig({ ...config, labelStyle: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="style1">Style 1 - Butterfly (Barcode Left)</SelectItem>
                    <SelectItem value="style2">Style 2 - Rectangular (Details Left)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paper-width" className="text-sm">
                    Paper width (mm)
                  </Label>
                  <Input
                    id="paper-width"
                    type="number"
                    value={config.paperWidth}
                    onChange={(e) => setConfig({ ...config, paperWidth: Number(e.target.value) })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="paper-height" className="text-sm">
                    Paper height (mm)
                  </Label>
                  <Input
                    id="paper-height"
                    type="number"
                    value={config.paperHeight}
                    onChange={(e) => setConfig({ ...config, paperHeight: Number(e.target.value) })}
                    className="h-10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="font-size" className="text-sm">
                    Font size (pt)
                  </Label>
                  <Input
                    id="font-size"
                    type="number"
                    value={config.fontSize}
                    onChange={(e) => setConfig({ ...config, fontSize: Number(e.target.value) })}
                    className="h-10"
                  />
                </div>
              </div>

              <div className="p-3 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-xs text-muted-foreground flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Drag text and barcode elements in preview to reposition them
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button onClick={handlePrint} className="flex-1 gap-2">
                  <Printer className="h-4 w-4" />
                  Print Label Only
                </Button>
                <Button variant="outline" className="flex-1 gap-2 glass-effect bg-transparent">
                  <Download className="h-4 w-4" />
                  Save Template
                </Button>
              </div>
            </div>
          </Card>

          {/* Preview Panel */}
          <Card className="p-6 glass-effect">
            <h2 className="mb-4 text-xl font-semibold">Label Preview & Editor</h2>
            <div
              className="flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-8 cursor-move"
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              <div ref={labelRef} className="relative">
                {config.labelStyle === "style1" ? (
                  <Style1Label
                    product={product}
                    config={config}
                    onMouseDown={handleMouseDown}
                    positions={elementPositions}
                    isDragging={draggingElement}
                  />
                ) : (
                  <Style2Label
                    product={product}
                    config={config}
                    onMouseDown={handleMouseDown}
                    positions={elementPositions}
                    isDragging={draggingElement}
                  />
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Style 1: Butterfly shape - Barcode on left, Details on right - WITH DRAGGING
function Style1Label({ product, config, onMouseDown, positions, isDragging }: any) {
  return (
    <div
      className="relative bg-white print:border-2 print:border-black"
      style={{
        width: `${config.paperWidth}mm`,
        height: `${config.paperHeight}mm`,
        fontSize: `${config.fontSize}pt`,
      }}
    >
      <div className="flex h-full items-center">
        {/* Left side - Barcode with drag capability */}
        <div
          className={`flex flex-1 items-center justify-center border-2 border-black rounded-l-3xl transition-all duration-300 ease-out ${
            isDragging === "barcode" ? "bg-blue-50" : ""
          }`}
          style={{ height: "100%", transform: `translate(${positions.barcode.x}px, ${positions.barcode.y}px)` }}
          onMouseDown={(e) => onMouseDown(e, "barcode")}
          data-draggable="true"
        >
          <div className="flex flex-col items-center cursor-grab active:cursor-grabbing">
            <svg width="120" height="80" viewBox="0 0 120 80">
              <rect x="5" y="5" width="2" height="60" fill="black" />
              <rect x="10" y="5" width="1" height="60" fill="black" />
              <rect x="14" y="5" width="3" height="60" fill="black" />
              <rect x="20" y="5" width="2" height="60" fill="black" />
              <rect x="25" y="5" width="1" height="60" fill="black" />
              <rect x="30" y="5" width="2" height="60" fill="black" />
              <rect x="35" y="5" width="3" height="60" fill="black" />
              <rect x="41" y="5" width="1" height="60" fill="black" />
              <rect x="45" y="5" width="2" height="60" fill="black" />
              <rect x="50" y="5" width="3" height="60" fill="black" />
              <rect x="56" y="5" width="1" height="60" fill="black" />
              <rect x="60" y="5" width="2" height="60" fill="black" />
              <rect x="65" y="5" width="1" height="60" fill="black" />
              <rect x="70" y="5" width="3" height="60" fill="black" />
              <rect x="76" y="5" width="2" height="60" fill="black" />
              <rect x="81" y="5" width="1" height="60" fill="black" />
              <rect x="85" y="5" width="2" height="60" fill="black" />
              <rect x="90" y="5" width="3" height="60" fill="black" />
              <rect x="96" y="5" width="1" height="60" fill="black" />
              <rect x="100" y="5" width="2" height="60" fill="black" />
              <rect x="105" y="5" width="1" height="60" fill="black" />
              <rect x="110" y="5" width="2" height="60" fill="black" />
            </svg>
            <div className="mt-1 text-xs font-mono">{product?.barcode || "4747564728"}</div>
          </div>
        </div>

        {/* Right side - Product details with drag capability */}
        <div
          className={`flex flex-1 flex-col justify-center border-2 border-l-0 border-black rounded-r-3xl p-2 transition-all duration-300 ease-out ${
            isDragging === "details" ? "bg-green-50" : ""
          }`}
          style={{ height: "100%", transform: `translate(${positions.details.x}px, ${positions.details.y}px)` }}
          onMouseDown={(e) => onMouseDown(e, "details")}
          data-draggable="true"
        >
          <div
            className="space-y-0.5 font-bold cursor-grab active:cursor-grabbing"
            style={{ fontSize: `${config.fontSize}pt` }}
          >
            <div className="text-left">{product?.name || "Pen.223 Real Diam."}</div>
            <div className="text-left">
              {product?.metal_type || "YG"}-{product?.purity || "10"}-{product?.gold_weight || "3.196"}gr.
            </div>
            <div className="text-left">
              Dia:{product?.diamond_carat || "0.20"}ct.⚪{product?.diamond_type || "H-SI1"}
            </div>
            <div className="text-left font-bold">Price:${product?.price || "3740.00"}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Style 2: Rectangular - WITH DRAGGING
function Style2Label({ product, config, onMouseDown, positions, isDragging }: any) {
  return (
    <div
      className="bg-white print:border print:border-black relative"
      style={{
        width: `${config.paperWidth}mm`,
        height: `${config.paperHeight}mm`,
        fontSize: `${config.fontSize}pt`,
      }}
    >
      <div className="flex h-full">
        {/* Left side - Product details */}
        <div
          className={`flex flex-1 flex-col justify-center bg-blue-50 p-3 transition-all duration-300 ease-out ${
            isDragging === "details" ? "ring-2 ring-blue-400" : ""
          }`}
          style={{ transform: `translate(${positions.details.x}px, ${positions.details.y}px)` }}
          onMouseDown={(e) => onMouseDown(e, "details")}
          data-draggable="true"
        >
          <div
            className="space-y-0.5 font-bold cursor-grab active:cursor-grabbing"
            style={{ fontSize: `${config.fontSize}pt` }}
          >
            <div>{product?.name || "Semi 3037 Real Diam."}</div>
            <div>{product?.sku || "Semi-Mount-1034-Nat"}</div>
            <div>
              :{product?.purity || "18K"}.{product?.gold_weight || "5.109"}Gr.
            </div>
            <div>
              Dia:{product?.diamond_carat || "0.55"}Ct. {product?.custom_text || "DE-VVS1"}
            </div>
            <div>Dw : {product?.diamond_carat || "0.55"}ct</div>
            <div className="pt-1">Price:${product?.price || "10,990.00"}</div>
          </div>
        </div>

        {/* Right side - Barcode */}
        <div
          className={`flex flex-1 flex-col items-center justify-center p-3 transition-all duration-300 ease-out ${
            isDragging === "barcode" ? "ring-2 ring-green-400" : ""
          }`}
          style={{ transform: `translate(${positions.barcode.x}px, ${positions.barcode.y}px)` }}
          onMouseDown={(e) => onMouseDown(e, "barcode")}
          data-draggable="true"
        >
          <svg width="140" height="90" viewBox="0 0 140 90" className="cursor-grab active:cursor-grabbing">
            <rect x="5" y="5" width="3" height="70" fill="black" />
            <rect x="11" y="5" width="1" height="70" fill="black" />
            <rect x="15" y="5" width="4" height="70" fill="black" />
            <rect x="22" y="5" width="2" height="70" fill="black" />
            <rect x="27" y="5" width="1" height="70" fill="black" />
            <rect x="32" y="5" width="3" height="70" fill="black" />
            <rect x="38" y="5" width="4" height="70" fill="black" />
            <rect x="45" y="5" width="1" height="70" fill="black" />
            <rect x="49" y="5" width="2" height="70" fill="black" />
            <rect x="54" y="5" width="3" height="70" fill="black" />
            <rect x="60" y="5" width="1" height="70" fill="black" />
            <rect x="64" y="5" width="2" height="70" fill="black" />
            <rect x="69" y="5" width="1" height="70" fill="black" />
            <rect x="73" y="5" width="4" height="70" fill="black" />
            <rect x="80" y="5" width="2" height="70" fill="black" />
            <rect x="85" y="5" width="1" height="70" fill="black" />
            <rect x="89" y="5" width="3" height="70" fill="black" />
            <rect x="95" y="5" width="4" height="70" fill="black" />
            <rect x="102" y="5" width="1" height="70" fill="black" />
            <rect x="106" y="5" width="2" height="70" fill="black" />
            <rect x="111" y="5" width="1" height="70" fill="black" />
            <rect x="115" y="5" width="3" height="70" fill="black" />
            <rect x="121" y="5" width="2" height="70" fill="black" />
            <rect x="126" y="5" width="1" height="70" fill="black" />
            <rect x="130" y="5" width="2" height="70" fill="black" />
          </svg>
          <div className="text-center text-sm font-bold font-mono">{product?.barcode || "524971680841"}</div>
        </div>
      </div>
    </div>
  )
}
