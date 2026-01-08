import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Package, ShoppingCart, TrendingUp, Users, AlertTriangle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts"
import { Badge } from "@/components/ui/badge"

async function getDashboardData() {
  const supabase = await createClient()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const { data: todaySales } = await supabase.from("sales").select("total_amount").gte("sale_date", today.toISOString())

  const todayRevenue = todaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const { data: yesterdaySales } = await supabase
    .from("sales")
    .select("total_amount")
    .gte("sale_date", yesterday.toISOString())
    .lt("sale_date", today.toISOString())

  const yesterdayRevenue = yesterdaySales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const revenueChange = yesterdayRevenue > 0 ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100 : 0

  const { data: products } = await supabase.from("products").select("stock_quantity, min_stock_level, name")

  const totalProducts = products?.length || 0
  const lowStockProducts = products?.filter((p) => p.stock_quantity <= p.min_stock_level) || []

  const { count: customerCount } = await supabase.from("customers").select("*", { count: "exact", head: true })

  const { count: salesCount } = await supabase
    .from("sales")
    .select("*", { count: "exact", head: true })
    .gte("sale_date", today.toISOString())

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: monthlySales } = await supabase
    .from("sales")
    .select("sale_date, total_amount")
    .gte("sale_date", thirtyDaysAgo.toISOString())
    .order("sale_date", { ascending: true })

  // Group sales by day
  const salesByDay = monthlySales?.reduce((acc: Record<string, number>, sale) => {
    const date = new Date(sale.sale_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    acc[date] = (acc[date] || 0) + Number(sale.total_amount)
    return acc
  }, {})

  const chartData = Object.entries(salesByDay || {}).map(([date, amount]) => ({
    date,
    amount,
  }))

  const { data: categoryData } = await supabase.from("sale_items").select(`
    product_id,
    quantity,
    total_price,
    products!inner(category)
  `)

  const categoryCounts = categoryData?.reduce((acc: Record<string, { count: number; revenue: number }>, item) => {
    const category = item.products?.category || "other"
    if (!acc[category]) acc[category] = { count: 0, revenue: 0 }
    acc[category].count += item.quantity
    acc[category].revenue += Number(item.total_price)
    return acc
  }, {})

  const categoryChartData = Object.entries(categoryCounts || {}).map(([name, data]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value: data.count,
    revenue: data.revenue,
  }))

  const { data: recentSales } = await supabase
    .from("sales")
    .select(
      `
      id,
      invoice_number,
      total_amount,
      sale_date,
      customers(full_name)
    `,
    )
    .order("sale_date", { ascending: false })
    .limit(5)

  return {
    todayRevenue,
    revenueChange,
    totalProducts,
    lowStockProducts,
    customerCount: customerCount || 0,
    salesCount: salesCount || 0,
    chartData,
    categoryChartData,
    recentSales: recentSales || [],
  }
}

const COLORS = ["#D97706", "#F59E0B", "#FBBF24", "#FCD34D", "#FDE68A"]

export default async function DashboardPage() {
  const data = await getDashboardData()

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight text-balance">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back to your Jewellery100 POS system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today&apos;s Revenue</CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{data.todayRevenue.toLocaleString("en-IN")}</div>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-xs text-muted-foreground">{data.salesCount} transactions</p>
              {data.revenueChange !== 0 && (
                <Badge variant={data.revenueChange > 0 ? "default" : "secondary"} className="text-xs">
                  {data.revenueChange > 0 ? "+" : ""}
                  {data.revenueChange.toFixed(1)}%
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalProducts}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.lowStockProducts.length > 0 ? (
                <span className="text-destructive font-medium">⚠️ {data.lowStockProducts.length} low stock</span>
              ) : (
                "All items well stocked"
              )}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-green-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.customerCount}</div>
            <p className="text-xs text-muted-foreground mt-1">Active customer base</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Growth</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12.5%</div>
            <p className="text-xs text-muted-foreground mt-1">vs last month</p>
          </CardContent>
        </Card>
      </div>

      {data.lowStockProducts.length > 0 && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-sm mb-1">Low Stock Alert</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {data.lowStockProducts.length} product{data.lowStockProducts.length > 1 ? "s" : ""} running low on
                  stock
                </p>
                <div className="flex gap-2 flex-wrap">
                  {data.lowStockProducts.slice(0, 3).map((product) => (
                    <Badge key={product.name} variant="outline" className="text-xs">
                      {product.name}: {product.stock_quantity} left
                    </Badge>
                  ))}
                  {data.lowStockProducts.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{data.lowStockProducts.length - 3} more
                    </Badge>
                  )}
                </div>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href="/products">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales Trend (Last 30 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Line type="monotone" dataKey="amount" stroke="#D97706" strokeWidth={3} dot={{ fill: "#D97706" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data.recentSales.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No recent sales</p>
              ) : (
                data.recentSales.map((sale) => (
                  <Link
                    key={sale.id}
                    href={`/sales/${sale.id}`}
                    className="block p-3 rounded-lg hover:bg-muted/50 transition-colors border"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <p className="font-medium text-sm">{sale.invoice_number}</p>
                      <p className="text-sm font-semibold text-primary">
                        ₹{Number(sale.total_amount).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {sale.customers?.full_name || "Walk-in"} •{" "}
                      {new Date(sale.sale_date).toLocaleString("en-IN", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Sales by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.categoryChartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip
                  formatter={(value: number, name: string) =>
                    name === "revenue" ? [`₹${value.toLocaleString("en-IN")}`, "Revenue"] : [value, "Units Sold"]
                  }
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
                <Bar dataKey="value" fill="#D97706" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={data.categoryChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="revenue"
                >
                  {data.categoryChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `₹${value.toLocaleString("en-IN")}`}
                  contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))" }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Button asChild variant="outline" size="lg" className="h-auto py-4 justify-start bg-transparent">
              <Link href="/sales/(create)/new">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">New Sale</p>
                    <p className="text-xs text-muted-foreground">Start transaction</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto py-4 justify-start bg-transparent">
              <Link href="/products/new">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Add Product</p>
                    <p className="text-xs text-muted-foreground">Create new item</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto py-4 justify-start bg-transparent">
              <Link href="/customers/new">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                    <Users className="h-5 w-5 text-green-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">Add Customer</p>
                    <p className="text-xs text-muted-foreground">Register new</p>
                  </div>
                </div>
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="h-auto py-4 justify-start bg-transparent">
              <Link href="/reports">
                <div className="flex items-center gap-3 w-full">
                  <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-purple-500" />
                  </div>
                  <div className="text-left">
                    <p className="font-semibold">View Reports</p>
                    <p className="text-xs text-muted-foreground">Analytics</p>
                  </div>
                </div>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
