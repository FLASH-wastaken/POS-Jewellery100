import { ProductForm } from "@/components/product-form"

export default function NewProductPage() {
  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold font-serif tracking-tight">Add new product</h1>
      </div>
      <ProductForm />
    </div>
  )
}
