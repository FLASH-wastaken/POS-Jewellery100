/*
  CUSTOM REPORT BUILDER
  
  Allows users to create custom reports from database:
  - Choose data source (Sales, Customers, Products, Invoices)
  - Filter by date range, categories, amounts
  - Select metrics to display
  - Group and aggregate data
  - Export to CSV/PDF
  
  Examples:
  - How many customers added this month
  - New products added and when
  - Sales by employee (who sold more/less)
  - Revenue by category over time
  - Customer spending patterns
*/

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Play, Save, Download } from "lucide-react"

export default function ReportBuilderPage() {
  const [activeTab, setActiveTab] = useState("create")
  const [reports, setReports] = useState([])

  const reportTemplates = [
    { id: "customers-added", name: "New Customers", description: "Customers added in selected period" },
    { id: "products-added", name: "New Products", description: "Products added to inventory" },
    { id: "sales-by-employee", name: "Sales by Employee", description: "Compare sales performance" },
    { id: "revenue-category", name: "Revenue by Category", description: "Revenue breakdown by product type" },
    { id: "customer-spending", name: "Top Customers", description: "Highest spending customers" },
    { id: "inventory-movement", name: "Inventory Movement", description: "Stock changes and movements" },
  ]

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold">Reports</h1>
        <p className="text-muted-foreground">Create custom reports from your business data</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 glass-effect">
          <TabsTrigger value="create">Create Report</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="saved">Saved Reports ({reports.length})</TabsTrigger>
        </TabsList>

        {/* Create Report Tab */}
        <TabsContent value="create" className="mt-6 space-y-6">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle>Build Custom Report</CardTitle>
              <CardDescription>Select data source and configure your report</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Data Source Selection */}
              <div>
                <label className="text-sm font-medium">Data Source</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                  {[
                    { id: "sales", name: "Sales Transactions" },
                    { id: "customers", name: "Customer Data" },
                    { id: "products", name: "Product Inventory" },
                    { id: "invoices", name: "Invoices" },
                    { id: "staff", name: "Staff Performance" },
                    { id: "loyalty", name: "Loyalty Points" },
                  ].map((source) => (
                    <button
                      key={source.id}
                      className="p-3 rounded-lg border-2 border-muted hover:border-primary hover:bg-primary/5 transition-all text-left text-sm"
                    >
                      {source.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="text-sm font-medium">Date Range</label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <input type="date" className="p-2 rounded-lg border border-white/10 bg-muted/50 text-sm" />
                  <input type="date" className="p-2 rounded-lg border border-white/10 bg-muted/50 text-sm" />
                </div>
              </div>

              {/* Metrics Selection */}
              <div>
                <label className="text-sm font-medium">Metrics to Display</label>
                <div className="space-y-2 mt-2 max-h-40 overflow-auto">
                  {[
                    "Total Revenue",
                    "Transaction Count",
                    "Average Transaction",
                    "Customer Count",
                    "Product Count",
                    "Category Breakdown",
                    "Top Performers",
                    "Growth Rate",
                  ].map((metric) => (
                    <label key={metric} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded" />
                      <span className="text-sm">{metric}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="text-sm font-medium">Filters (Optional)</label>
                <div className="space-y-2 mt-2">
                  <select className="w-full p-2 rounded-lg border border-white/10 bg-muted/50 text-sm">
                    <option>Filter by...</option>
                    <option>Category</option>
                    <option>Amount Range</option>
                    <option>Payment Method</option>
                    <option>Customer Type</option>
                  </select>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex gap-2 pt-4">
                <Button className="flex-1 gap-2">
                  <Play className="h-4 w-4" />
                  Generate Report
                </Button>
                <Button variant="outline" className="gap-2 bg-transparent">
                  <Save className="h-4 w-4" />
                  Save as Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportTemplates.map((template) => (
              <Card
                key={template.id}
                className="glass-effect border-white/10 hover:border-primary/50 transition-all cursor-pointer"
              >
                <CardHeader>
                  <CardTitle className="text-base">{template.name}</CardTitle>
                  <CardDescription className="text-sm">{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button size="sm" className="w-full gap-2">
                    <Plus className="h-3 w-3" />
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Saved Reports Tab */}
        <TabsContent value="saved" className="mt-6">
          {reports.length === 0 ? (
            <Card className="glass-effect border-white/10">
              <CardContent className="pt-8 pb-8 text-center">
                <p className="text-muted-foreground mb-4">No saved reports yet. Create one to get started.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {reports.map((report) => (
                <Card key={report.id} className="glass-effect border-white/10">
                  <CardContent className="pt-6 pb-6 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{report.name}</p>
                      <p className="text-xs text-muted-foreground">Created {report.date}</p>
                    </div>
                    <Button size="sm" variant="outline" className="gap-2 bg-transparent">
                      <Download className="h-3 w-3" />
                      Export
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
