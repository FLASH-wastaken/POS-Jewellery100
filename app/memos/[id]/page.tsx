import { Suspense } from "react"
import { MemoDetail } from "@/components/memo-detail"

export default function MemoDetailPage({ params }: { params: { id: string } }) {
  return (
    <Suspense fallback={<div>Loading memo details...</div>}>
      <MemoDetail memoId={params.id} />
    </Suspense>
  )
}
