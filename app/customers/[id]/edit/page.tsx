import { createClient } from "@/lib/supabase/server"
import { CustomerForm } from "@/components/customer-form"
import { notFound } from "next/navigation"

export default async function EditCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: customer } = await supabase.from("customers").select("*").eq("id", id).single()

  if (!customer) {
    notFound()
  }

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Edit Customer</h1>
        <p className="text-muted-foreground">Update customer information</p>
      </div>
      <CustomerForm customer={customer} />
    </div>
  )
}
