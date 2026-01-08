import { CustomerForm } from "@/components/customer-form"

export default function NewCustomerPage() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Add Customer</h1>
        <p className="text-muted-foreground">Register a new customer</p>
      </div>
      <CustomerForm />
    </div>
  )
}
