import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Edit, Mail, Phone, MapPin, Calendar, Award } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single()

  if (!customer) {
    notFound()
  }

  // Get customer's purchase history
  const { data: purchases } = await supabase
    .from("sales")
    .select("*, sale_items(*)")
    .eq("customer_id", id)
    .order("sale_date", { ascending: false })
    .limit(10)

  const totalPurchases = purchases?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0
  const purchaseCount = purchases?.length || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">{customer.full_name}</h1>
          <p className="text-muted-foreground">Customer #{customer.customer_code}</p>
        </div>
        <Button asChild>
          <Link href={`/customers/${id}/edit`}>
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="font-medium">{customer.phone}</p>
              </div>
            </div>
            {customer.email && (
              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{customer.email}</p>
                </div>
              </div>
            )}
            {customer.address && (
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Address</p>
                  <p className="font-medium">
                    {customer.address}
                    {customer.city && `, ${customer.city}`}
                    {customer.state && `, ${customer.state}`}
                    {customer.pincode && ` - ${customer.pincode}`}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Customer Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Award className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Loyalty Points</p>
                <p className="text-2xl font-bold">{customer.loyalty_points}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Purchases</p>
                <p className="text-2xl font-bold">₹{totalPurchases.toLocaleString("en-IN")}</p>
                <p className="text-xs text-muted-foreground">{purchaseCount} transactions</p>
              </div>
            </div>
            {customer.date_of_birth && (
              <div>
                <p className="text-sm text-muted-foreground">Date of Birth</p>
                <p className="font-medium">{new Date(customer.date_of_birth).toLocaleDateString()}</p>
              </div>
            )}
            {customer.anniversary_date && (
              <div>
                <p className="text-sm text-muted-foreground">Anniversary</p>
                <p className="font-medium">{new Date(customer.anniversary_date).toLocaleDateString()}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchase History</CardTitle>
        </CardHeader>
        <CardContent>
          {purchases && purchases.length > 0 ? (
            <div className="space-y-4">
              {purchases.map((purchase) => (
                <Link
                  key={purchase.id}
                  href={`/sales/${purchase.id}`}
                  className="flex items-center justify-between border-b pb-4 last:border-0 hover:bg-accent/50 p-2 rounded transition-colors"
                >
                  <div>
                    <p className="font-medium">Invoice #{purchase.invoice_number}</p>
                    <p className="text-sm text-muted-foreground">{new Date(purchase.sale_date).toLocaleDateString()}</p>
                    <p className="text-xs text-muted-foreground">{purchase.sale_items.length} items</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">₹{Number(purchase.total_amount).toLocaleString("en-IN")}</p>
                    <Badge
                      variant={purchase.payment_status === "completed" ? "default" : "secondary"}
                      className="capitalize"
                    >
                      {purchase.payment_status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No purchases yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
