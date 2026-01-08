import { Suspense } from "react"
import { POSContent } from "@/components/pos-content"

export const metadata = {
  title: "Invoicing - Jewellery100",
  description: "Create invoices for immediate sales transactions",
}

export default function POSPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center">Loading Invoicing...</div>}>
      <POSContent />
    </Suspense>
  )
}
