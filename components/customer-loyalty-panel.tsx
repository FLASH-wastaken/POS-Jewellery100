/*
  CUSTOMER LOYALTY PANEL
  
  Displays and manages customer loyalty points:
  - Current balance and tier
  - Point expiry date
  - History of transactions
  - Option to transfer points (inheritance)
  - Manual point adjustments (admin only)
*/

"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Eraser as Transfer, Calendar } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export function CustomerLoyaltyPanel({ customer, userRole }: { customer: any; userRole: string }) {
  const [showTransferForm, setShowTransferForm] = useState(false)
  const [showManualAdjust, setShowManualAdjust] = useState(false)

  // Determine loyalty tier
  const getTier = (points: number) => {
    if (points >= 10000) return { name: "platinum", color: "bg-purple-500" }
    if (points >= 5000) return { name: "gold", color: "bg-yellow-500" }
    if (points >= 2000) return { name: "silver", color: "bg-gray-400" }
    return { name: "bronze", color: "bg-orange-600" }
  }

  const tier = getTier(customer.loyalty_points || 0)

  return (
    <div className="space-y-6">
      {/* Loyalty Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-effect border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Loyalty Points</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{customer.loyalty_points || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {Math.floor((customer.loyalty_points || 0) / 100)} purchases worth
            </p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tier Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`h-3 w-3 rounded-full ${tier.color}`}></div>
              <span className="font-bold capitalize">{tier.name}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Premium membership</p>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Points Expiry</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {customer.loyalty_expiry ? new Date(customer.loyalty_expiry).toLocaleDateString() : "No expiry"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Annual renewal</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Tabs */}
      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 glass-effect">
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
          {userRole === "admin" && <TabsTrigger value="adjust">Adjust</TabsTrigger>}
          <TabsTrigger value="tiers">Tiers</TabsTrigger>
        </TabsList>

        {/* History Tab */}
        <TabsContent value="history" className="mt-4">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle>Points History</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-auto">
                {[
                  { date: "Today", reason: "Purchase", points: "+50", type: "add" },
                  { date: "Yesterday", reason: "Refund", points: "-20", type: "remove" },
                  { date: "2 days ago", reason: "Bonus", points: "+100", type: "add" },
                ].map((entry, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{entry.reason}</p>
                      <p className="text-xs text-muted-foreground">{entry.date}</p>
                    </div>
                    <span className={`font-bold ${entry.type === "add" ? "text-green-600" : "text-red-600"}`}>
                      {entry.points}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Transfer Tab */}
        <TabsContent value="transfer" className="mt-4">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle>Transfer Points</CardTitle>
              <CardDescription>Transfer loyalty points to another customer (e.g., inheritance)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showTransferForm ? (
                <Button onClick={() => setShowTransferForm(true)} className="w-full gap-2">
                  <Transfer className="h-4 w-4" />
                  Start Transfer
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Recipient Customer</label>
                    <Input placeholder="Search customer name or ID" className="mt-1.5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Points to Transfer</label>
                    <Input type="number" placeholder="0" className="mt-1.5" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Reason</label>
                    <Textarea
                      placeholder="e.g., Customer passed away, transferring to spouse"
                      className="mt-1.5 min-h-20"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button className="flex-1">Submit Transfer</Button>
                    <Button variant="outline" onClick={() => setShowTransferForm(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Adjust Tab */}
        {userRole === "admin" && (
          <TabsContent value="adjust" className="mt-4">
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle>Manual Adjustment</CardTitle>
                <CardDescription>Adjust points manually for special cases</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!showManualAdjust ? (
                  <Button onClick={() => setShowManualAdjust(true)} className="w-full gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Adjust Points
                  </Button>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Points Change</label>
                      <Input type="number" placeholder="+500 or -100" className="mt-1.5" />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Reason</label>
                      <select className="w-full p-2 rounded-lg border border-white/10 bg-muted/50 mt-1.5 text-sm">
                        <option>Manual Adjustment</option>
                        <option>Compensation</option>
                        <option>Promotion</option>
                        <option>Error Correction</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Notes</label>
                      <Textarea placeholder="Admin notes..." className="mt-1.5 min-h-20" />
                    </div>
                    <div className="flex gap-2">
                      <Button className="flex-1">Apply Adjustment</Button>
                      <Button variant="outline" onClick={() => setShowManualAdjust(false)} className="flex-1">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tiers Tab */}
        <TabsContent value="tiers" className="mt-4">
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle>Loyalty Tiers</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { tier: "Bronze", points: "0-2000", color: "bg-orange-600" },
                { tier: "Silver", points: "2000-5000", color: "bg-gray-400" },
                { tier: "Gold", points: "5000-10000", color: "bg-yellow-500" },
                { tier: "Platinum", points: "10000+", color: "bg-purple-500" },
              ].map((t) => (
                <div key={t.tier} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`h-3 w-3 rounded-full ${t.color}`}></div>
                    <div>
                      <p className="font-medium">{t.tier}</p>
                      <p className="text-xs text-muted-foreground">{t.points} points</p>
                    </div>
                  </div>
                  {customer.loyalty_points >= Number.parseInt(t.points) && <Badge>Current</Badge>}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
