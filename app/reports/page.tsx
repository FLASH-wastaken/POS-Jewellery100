import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

async function getReportsData() {
  const supabase = await createClient()

  // Get sales data for last 30 days
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: sales } = await supabase
    .from("sales")
    .select("sale_date, total_amount, payment_method")
    .gte("sale_date", thirtyDaysAgo.toISOString())

  // Get top selling products
  const { data: topProducts } = await supabase.from("sale_items").select(`
      product_name,
      quantity,
      total_price
    `)

  // Aggregate top products
  const productStats = topProducts?.reduce((acc: Record<string, { quantity: number; revenue: number }>, item) => {
    if (!acc[item.product_name]) {
      acc[item.product_name] = { quantity: 0, revenue: 0 }
    }
    acc[item.product_name].quantity += item.quantity
    acc[item.product_name].revenue += Number(item.total_price)
    return acc
  }, {})

  const topProductsData = Object.entries(productStats || {})
    .map(([name, stats]) => ({
      name,
      quantity: stats.quantity,
      revenue: stats.revenue,
    }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10)

  // Payment method distribution
  const paymentStats = sales?.reduce((acc: Record<string, number>, sale) => {
    acc[sale.payment_method] = (acc[sale.payment_method] || 0) + 1
    return acc
  }, {})

  const paymentData = Object.entries(paymentStats || {}).map(([method, count]) => ({
    name: method.charAt(0).toUpperCase() + method.slice(1),
    value: count,
  }))

  // Daily sales trend
  const dailySales = sales?.reduce((acc: Record<string, number>, sale) => {
    const date = new Date(sale.sale_date).toLocaleDateString()
    acc[date] = (acc[date] || 0) + Number(sale.total_amount)
    return acc
  }, {})

  const salesTrendData = Object.entries(dailySales || {})
    .map(([date, amount]) => ({ date, amount }))
    .slice(-14) // Last 14 days

  // Get inventory status
  const { data: lowStock } = await supabase
    .from("products")
    .select("name, stock_quantity, min_stock_level")
    .lte("stock_quantity", 10)
    .order("stock_quantity")

  return {
    topProductsData,
    paymentData,
    salesTrendData,
    lowStock: lowStock || [],
  }
}

const COLORS = ["#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"]

export default async function ReportsPage() {
  const data = await getReportsData()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Reports & Analytics</h1>
        <p className="text-muted-foreground">Business insights and performance metrics</p>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="products">Product Performance</TabsTrigger>
          <TabsTrigger value="inventory">Inventory Status</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Sales Trend (Last 14 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.salesTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                      labelStyle={{ color: "#000" }}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#D97706" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={data.paymentData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {data.paymentData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 10 Selling Products</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={data.topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={150} />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      name === "revenue" ? `₹${value.toLocaleString("en-IN")}` : value
                    }
                    labelStyle={{ color: "#000" }}
                  />
                  <Legend />
                  <Bar dataKey="quantity" fill="#F59E0B" name="Quantity Sold" />
                  <Bar dataKey="revenue" fill="#D97706" name="Revenue (₹)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Low Stock Alert</CardTitle>
            </CardHeader>
            <CardContent>
              {data.lowStock.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">All products are well stocked</p>
              ) : (
                <div className="space-y-4">
                  {data.lowStock.map((product, index) => (
                    <div key={index} className="flex items-center justify-between border-b pb-4 last:border-0">
                      <div>
                        <p className="font-medium">{product.name}</p>
                        <p className="text-sm text-muted-foreground">Min level: {product.min_stock_level} units</p>
                      </div>
                      <div
                        className={`text-lg font-bold ${product.stock_quantity === 0 ? "text-destructive" : "text-orange-600"}`}
                      >
                        {product.stock_quantity} units
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
