import { createClient } from "@/lib/supabase/server"
import { POSInterface } from "@/components/pos-interface"

export default async function NewSalePage() {
  const supabase = await createClient()

  const { data: products } = await supabase.from("products").select("*").gt("stock_quantity", 0).order("name")

  const { data: customers } = await supabase
    .from("customers")
    .select("id, full_name, phone, customer_code, email")
    .order("full_name")

  // Get product categories with counts
  const { data: categoryData } = await supabase.from("products").select("category").gt("stock_quantity", 0)

  const categoryCounts: Record<string, number> = {}
  categoryData?.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1
  })

  return (
    <div className="h-[calc(100vh-4rem)]">
      <POSInterface products={products || []} customers={customers || []} categoryCounts={categoryCounts} />
    </div>
  )
}
