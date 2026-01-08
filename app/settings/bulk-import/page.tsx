import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BulkImportForm } from "@/components/bulk-import-form"

export default function BulkImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Bulk Product Import</h1>
        <p className="text-muted-foreground">Import products from CSV, Excel, SQL, or HTML files</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Import Products</CardTitle>
            <CardDescription>Upload a file to bulk import your product inventory</CardDescription>
          </CardHeader>
          <CardContent>
            <BulkImportForm />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supported Formats</CardTitle>
            <CardDescription>File types and requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-1">CSV</h4>
              <p className="text-xs text-muted-foreground">
                Comma-separated values with headers: name, category, price, stock_quantity, sku, metal_type,
                weight_grams
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">Excel</h4>
              <p className="text-xs text-muted-foreground">.xlsx or .xls files with product data in first sheet</p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">SQL</h4>
              <p className="text-xs text-muted-foreground">
                INSERT statements with the same column structure as products table
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">HTML</h4>
              <p className="text-xs text-muted-foreground">HTML tables with product data in tr/td elements</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
