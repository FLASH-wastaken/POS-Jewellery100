import { Suspense } from "react"
import { MemosContent } from "@/components/memos-content"

export const metadata = {
  title: "Memo Management - Jewellery100",
  description: "Track and manage memos, conversions, and returns",
}

export default function MemosPage() {
  return (
    <Suspense fallback={<div>Loading memos...</div>}>
      <MemosContent />
    </Suspense>
  )
}
