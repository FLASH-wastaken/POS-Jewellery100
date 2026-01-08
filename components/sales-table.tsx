"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import Link from "next/link"

interface Sale {
  id: string
  invoice_number: string
  sale_date: string
  total_amount: number
  payment_method: string
  payment_status: string
  customers?: {
    full_name: string
    phone: string
  } | null
}

export function SalesTable({ sales }: { sales: Sale[] }) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Payment Method</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sales.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                No sales found
              </TableCell>
            </TableRow>
          ) : (
            sales.map((sale) => (
              <TableRow key={sale.id}>
                <TableCell className="font-mono text-xs">{sale.invoice_number}</TableCell>
                <TableCell>{new Date(sale.sale_date).toLocaleDateString()}</TableCell>
                <TableCell>
                  {sale.customers ? (
                    <div>
                      <p className="font-medium">{sale.customers.full_name}</p>
                      <p className="text-xs text-muted-foreground">{sale.customers.phone}</p>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Walk-in</span>
                  )}
                </TableCell>
                <TableCell className="capitalize">{sale.payment_method}</TableCell>
                <TableCell>
                  <Badge variant={sale.payment_status === "completed" ? "default" : "secondary"} className="capitalize">
                    {sale.payment_status}
                  </Badge>
                </TableCell>
                <TableCell className="font-semibold">₹{Number(sale.total_amount).toLocaleString("en-IN")}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="icon">
                    <Link href={`/sales/${sale.id}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
