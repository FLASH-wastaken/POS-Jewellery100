"use client"

import { useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, AlertTriangle, Eye } from "lucide-react"
import Link from "next/link"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface Product {
  id: string
  sku: string
  name: string
  category: string
  metal_type: string | null
  weight_grams: number | null
  price: number
  stock_quantity: number
  min_stock_level: number
}

export function ProductsTable({ products }: { products: Product[] }) {
  const [isDeleting, setIsDeleting] = useState<string | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    const supabase = createClient()
    const { error } = await supabase.from("products").delete().eq("id", id)

    if (!error) {
      router.refresh()
    }
    setIsDeleting(null)
  }

  return (
    <div className="rounded-2xl border border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden shadow-lg">
      <Table>
        <TableHeader>
          <TableRow className="border-border/50 bg-muted/30 hover:bg-muted/40 transition-all duration-300 ease-out">
            <TableHead className="font-semibold text-foreground">SKU</TableHead>
            <TableHead className="font-semibold text-foreground">Name</TableHead>
            <TableHead className="font-semibold text-foreground">Category</TableHead>
            <TableHead className="font-semibold text-foreground">Metal</TableHead>
            <TableHead className="font-semibold text-foreground">Weight (g)</TableHead>
            <TableHead className="font-semibold text-foreground">Price</TableHead>
            <TableHead className="font-semibold text-foreground">Stock</TableHead>
            <TableHead className="text-right font-semibold text-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center">
                <div className="text-muted-foreground">No products found</div>
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => (
              <TableRow
                key={product.id}
                className="border-border/30 hover:bg-muted/20 transition-all duration-300 ease-out"
              >
                <TableCell className="font-mono text-xs font-medium">{product.sku}</TableCell>
                <TableCell className="font-medium text-foreground">{product.name}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className="rounded-lg capitalize">
                    {product.category}
                  </Badge>
                </TableCell>
                <TableCell className="capitalize text-muted-foreground">{product.metal_type || "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {product.weight_grams ? product.weight_grams.toFixed(2) : "-"}
                </TableCell>
                <TableCell className="font-semibold text-foreground">
                  ₹{product.price.toLocaleString("en-IN")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{product.stock_quantity}</span>
                    {product.stock_quantity <= product.min_stock_level && (
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg transition-all duration-300 ease-out hover:bg-muted"
                    >
                      <Link href={`/products/${product.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 rounded-lg transition-all duration-300 ease-out hover:bg-muted"
                    >
                      <Link href={`/products/${product.id}/edit`}>
                        <Edit className="h-4 w-4" />
                      </Link>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          disabled={isDeleting === product.id}
                          className="h-9 w-9 rounded-lg transition-all duration-300 ease-out hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Product</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete {product.name}? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction className="rounded-lg">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
