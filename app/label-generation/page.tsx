import { Suspense } from "react"
import { LabelGenerationContent } from "@/components/label-generation-content"

export default function LabelGenerationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen">Loading...</div>}>
      <LabelGenerationContent />
    </Suspense>
  )
}
