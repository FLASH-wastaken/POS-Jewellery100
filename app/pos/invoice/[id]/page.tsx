import { Suspense } from "react"
import { InvoicePrint } from "@/components/invoice-print"

export default function InvoicePage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading invoice...</div>}>
      <InvoicePrint saleId={params.id} />
    </Suspense>
  )
}
