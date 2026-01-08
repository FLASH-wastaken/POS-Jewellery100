import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { SalesTable } from "@/components/sales-table"
import Link from "next/link"

export default async function SalesPage() {
  const supabase = await createClient()

  const { data: sales } = await supabase
    .from("sales")
    .select(
      `
      *,
      customers(full_name, phone)
    `,
    )
    .order("sale_date", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-serif tracking-tight">Sales</h1>
          <p className="text-muted-foreground">View and manage transactions</p>
        </div>
        <Button asChild>
          <Link href="/sales/new">
            <Plus className="mr-2 h-4 w-4" />
            New Sale
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <SalesTable sales={sales || []} />
        </CardContent>
      </Card>
    </div>
  )
}
