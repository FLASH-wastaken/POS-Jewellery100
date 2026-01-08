"use client"

import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, CheckCircle, RefreshCw, AlertCircle, Eye, FileText } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Memo {
  id: string
  invoice_number: string
  sale_date: string
  memo_due_date: string
  total_amount: number
  memo_status: string
  customers: {
    full_name: string
    phone: string
  }
  created_by_name: string
  urgency_status: string
  item_count: number
}

export function MemosContent() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("pending")
  const supabase = createClient()

  const loadMemos = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("memo_tracking")
      .select(`
        *,
        customers:customer_id (
          full_name,
          phone
        )
      `)
      .order("memo_due_date", { ascending: true })

    if (error) {
      console.error("Error loading memos:", error)
      toast.error("Failed to load memos")
    } else {
      setMemos((data || []).filter((memo) => memo.customers))
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => {
    loadMemos()
  }, [loadMemos])

  const filteredMemos = memos.filter((memo) => {
    const matchesSearch =
      memo.invoice_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (memo.customers?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false) ||
      (memo.customers?.phone?.includes(searchQuery) ?? false)

    const matchesTab =
      activeTab === "all" ||
      (activeTab === "pending" && memo.memo_status === "pending") ||
      (activeTab === "overdue" && memo.urgency_status === "Overdue") ||
      (activeTab === "due-soon" && memo.urgency_status === "Due Soon")

    return matchesSearch && matchesTab
  })

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      partially_returned: "outline",
      fully_returned: "outline",
      expired: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status.replace("_", " ").toUpperCase()}</Badge>
  }

  const getUrgencyBadge = (status: string) => {
    const config = {
      Overdue: { variant: "destructive" as const, icon: AlertCircle },
      "Due Soon": { variant: "outline" as const, icon: AlertCircle },
      Active: { variant: "secondary" as const, icon: CheckCircle },
    }
    const { variant, icon: Icon } = config[status as keyof typeof config] || config.Active
    return (
      <Badge variant={variant}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    )
  }

  const stats = {
    total: memos.length,
    overdue: memos.filter((m) => m.urgency_status === "Overdue").length,
    dueSoon: memos.filter((m) => m.urgency_status === "Due Soon").length,
    totalValue: memos.reduce((sum, m) => sum + m.total_amount, 0),
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Memo Management</h1>
        <p className="text-muted-foreground">Track memos, convert to invoices, and process returns</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Memos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Due Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.dueSoon}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by memo number, customer name, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={loadMemos} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending ({memos.filter((m) => m.memo_status === "pending").length})</TabsTrigger>
          <TabsTrigger value="overdue">Overdue ({stats.overdue})</TabsTrigger>
          <TabsTrigger value="due-soon">Due Soon ({stats.dueSoon})</TabsTrigger>
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {loading ? (
            <div className="text-center py-12">Loading memos...</div>
          ) : filteredMemos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No memos found</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredMemos.map((memo) => (
                <Card key={memo.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-semibold text-lg">{memo.invoice_number}</h3>
                          {getStatusBadge(memo.memo_status)}
                          {getUrgencyBadge(memo.urgency_status)}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Customer</p>
                            <p className="font-medium">{memo.customers.full_name}</p>
                            <p className="text-xs text-muted-foreground">{memo.customers.phone}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Created Date</p>
                            <p className="font-medium">{new Date(memo.sale_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Due Date</p>
                            <p className="font-medium">{new Date(memo.memo_due_date).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">
                              {Math.ceil((new Date(memo.memo_due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}{" "}
                              days
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Amount</p>
                            <p className="font-bold text-lg">${memo.total_amount.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{memo.item_count} items</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Link href={`/memos/${memo.id}`}>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </Link>
                        <Link href={`/memos/${memo.id}/convert`}>
                          <Button size="sm">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Convert
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
