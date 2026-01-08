"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Upload, CheckCircle2, AlertCircle, FileUp, Loader2, DownloadCloud } from "lucide-react"
import { parseCSV, parseExcel, parseSQL, parseHTML } from "@/lib/import-parsers"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface ImportResult {
  success: number
  failed: number
  errors: string[]
  message?: string
}

interface PreviewData {
  products: Record<string, unknown>[]
  columns: string[]
  columnMappings: Record<string, string> // detected column to DB column mapping
}

export function BulkImportForm() {
  const [importType, setImportType] = useState<"csv" | "excel" | "sql" | "html">("csv")
  const [file, setFile] = useState<File | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      setError(null)
      setResult(null)
      setPreview(null)
      setShowPreview(false)
    }
  }

  const handlePreview = async () => {
    if (!file) {
      setError("Please select a file to import")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      let products: Record<string, unknown>[] = []

      const fileContent = await file.text()

      if (importType === "csv") {
        products = parseCSV(fileContent)
      } else if (importType === "excel") {
        const arrayBuffer = await file.arrayBuffer()
        products = await parseExcel(arrayBuffer)
      } else if (importType === "sql") {
        products = parseSQL(fileContent)
      } else if (importType === "html") {
        products = parseHTML(fileContent)
      }

      console.log("[v0] Parsed preview products:", products)

      if (products.length === 0) {
        setError("No valid products found in file")
        setIsLoading(false)
        return
      }

      const firstProduct = products[0]
      const detectedColumns = Object.keys(firstProduct)
      const columnMappings = autoDetectColumnMappings(detectedColumns, firstProduct)

      setPreview({
        products: products.slice(0, 10),
        columns: detectedColumns,
        columnMappings,
      })
      setShowPreview(true)
    } catch (err) {
      console.error("[v0] Preview error:", err)
      setError(err instanceof Error ? err.message : "An error occurred while previewing file")
    } finally {
      setIsLoading(false)
    }
  }

  const autoDetectColumnMappings = (columns: string[], firstProduct: Record<string, unknown>) => {
    const mappings: Record<string, string> = {}
    const priceKeywords = ["price", "cost", "value", "amount", "selling", "sale"]
    const nameKeywords = ["name", "title", "product", "description", "item"]
    const categoryKeywords = ["category", "type", "category_id", "class"]
    const weightKeywords = ["weight", "grams", "gram", "wt", "gold_weight"]
    const diamondKeywords = ["diamond", "clarity", "grade", "vs", "vvs", "custom_text"]

    columns.forEach((col) => {
      const colLower = col.toLowerCase()

      if (nameKeywords.some((k) => colLower.includes(k))) {
        mappings[col] = "name"
      } else if (priceKeywords.some((k) => colLower.includes(k))) {
        if (colLower.includes("cost") || colLower.includes("making")) {
          mappings[col] = "making_charges"
        } else {
          mappings[col] = "price"
        }
      } else if (categoryKeywords.some((k) => colLower.includes(k))) {
        mappings[col] = "category"
      } else if (weightKeywords.some((k) => colLower.includes(k))) {
        mappings[col] = "weight_grams"
      } else if (diamondKeywords.some((k) => colLower.includes(k))) {
        mappings[col] = "custom_text"
      }
    })

    return mappings
  }

  const handleImport = async () => {
    if (!file || !preview) {
      setError("Please preview the file first")
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const productsToImport = preview.products.map((product) => {
        const cleaned: Record<string, unknown> = {}

        Object.entries(product).forEach(([key, value]) => {
          const keyLower = key.toLowerCase()

          // Skip these fields - they don't exist in the products table or are being regenerated
          if (
            keyLower === "sku" ||
            keyLower === "barcode" ||
            keyLower === "id" ||
            keyLower === "warehouse_id" ||
            keyLower === "supplier_id" ||
            keyLower === "has_variants"
          ) {
            return
          }

          cleaned[key] = value
        })

        return cleaned
      })

      console.log("[v0] Importing products (cleaned):", productsToImport.slice(0, 2))

      const response = await fetch("/api/products/bulk-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          products: productsToImport,
          columnMappings: preview.columnMappings,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Import failed"
        const contentType = response.headers.get("content-type")

        try {
          if (contentType?.includes("application/json")) {
            const errorData = await response.json()
            errorMessage = errorData.error || errorMessage
          } else {
            const text = await response.text()
            errorMessage = text || `HTTP ${response.status}: ${response.statusText}`
          }
        } catch (parseErr) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }

      const importResult = await response.json()
      console.log("[v0] Import result:", importResult)
      setResult(importResult)
      setShowPreview(false)
      setFile(null)
      setPreview(null)
    } catch (err) {
      console.error("[v0] Import error:", err)
      setError(err instanceof Error ? err.message : "An error occurred during import")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="csv" onValueChange={(v) => setImportType(v as any)} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="csv">CSV</TabsTrigger>
          <TabsTrigger value="excel">Excel</TabsTrigger>
          <TabsTrigger value="sql">SQL</TabsTrigger>
          <TabsTrigger value="html">HTML</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV File</Label>
            <div className="flex gap-2">
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isLoading}
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Upload any CSV file - columns will be auto-detected. Requires at least a name/product column.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="excel" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="excel-file">Excel File</Label>
            <div className="flex gap-2">
              <Input
                id="excel-file"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                disabled={isLoading}
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">Upload .xlsx or .xls files with product data</p>
          </div>
        </TabsContent>

        <TabsContent value="sql" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sql-file">SQL File</Label>
            <div className="flex gap-2">
              <Input
                id="sql-file"
                type="file"
                accept=".sql,.txt"
                onChange={handleFileChange}
                disabled={isLoading}
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">INSERT statements: INSERT INTO products (...) VALUES (...)</p>
          </div>
        </TabsContent>

        <TabsContent value="html" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="html-file">HTML File</Label>
            <div className="flex gap-2">
              <Input
                id="html-file"
                type="file"
                accept=".html,.htm"
                onChange={handleFileChange}
                disabled={isLoading}
                className="rounded-xl"
              />
            </div>
            <p className="text-xs text-muted-foreground">HTML tables with product data in table rows</p>
          </div>
        </TabsContent>
      </Tabs>

      {file && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <FileUp className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(2)} KB</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert variant={result.failed === 0 ? "default" : "destructive"}>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Import Complete</AlertTitle>
          <AlertDescription>
            {result.success} products imported successfully
            {result.failed > 0 && `, ${result.failed} failed`}
            {result.errors && result.errors.length > 0 && (
              <div className="mt-2 text-xs space-y-1 max-h-40 overflow-y-auto">
                {result.errors.map((err, idx) => (
                  <div key={idx} className="break-words">
                    • {err}
                  </div>
                ))}
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <div className="flex gap-3">
        <Button
          onClick={handlePreview}
          disabled={!file || isLoading}
          variant="outline"
          className="flex-1 rounded-xl h-11 bg-transparent"
        >
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <DownloadCloud className="mr-2 h-4 w-4" />}
          {isLoading ? "Previewing..." : "Preview Data"}
        </Button>
        <Button onClick={handleImport} disabled={!preview || isLoading} className="flex-1 rounded-xl h-11">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {isLoading ? "Importing..." : "Import Products"}
        </Button>
      </div>

      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-96 overflow-auto">
          <DialogHeader>
            <DialogTitle>Import Preview</DialogTitle>
            <DialogDescription>
              Review the detected columns and sample data before importing {preview?.products.length} products
            </DialogDescription>
          </DialogHeader>

          {preview && (
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Detected Columns & Mappings</h4>
                <div className="grid grid-cols-2 gap-2">
                  {preview.columns.map((col) => (
                    <div key={col} className="text-xs bg-muted p-2 rounded">
                      <span className="font-medium">{col}</span>
                      <span className="text-muted-foreground"> → {preview.columnMappings[col] || "ignored"}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-sm">Sample Data (First 3 rows)</h4>
                <div className="overflow-auto border rounded">
                  <table className="w-full text-xs">
                    <thead className="bg-muted">
                      <tr>
                        {preview.columns.map((col) => (
                          <th key={col} className="px-2 py-1 text-left font-medium">
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.products.slice(0, 3).map((product, idx) => (
                        <tr key={idx} className="border-t">
                          {preview.columns.map((col) => (
                            <td key={col} className="px-2 py-1 truncate max-w-xs">
                              {String(product[col] || "-")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
