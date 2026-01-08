/*
  CAMPAIGNS TAB
  
  Create and manage marketing campaigns for customer outreach
  Features:
  - Create new campaigns (Email, WhatsApp, SMS)
  - Set target audience (all, loyalty members, recent purchasers, etc.)
  - Schedule campaigns for future dates
  - View campaign history and performance
*/

"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Calendar } from "lucide-react"

export function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([])
  const [showNewForm, setShowNewForm] = useState(false)

  return (
    <div className="space-y-6">
      {/* Header with Create Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Marketing Campaigns</h2>
          <p className="text-muted-foreground mt-1">Create and manage customer outreach campaigns</p>
        </div>
        <Button onClick={() => setShowNewForm(!showNewForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* New Campaign Form */}
      {showNewForm && (
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle>Create New Campaign</CardTitle>
            <CardDescription>Set up a new marketing campaign to reach your customers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Campaign Name</label>
              <Input placeholder="e.g., Summer Sale 2024" className="mt-1.5" />
            </div>

            <div>
              <label className="text-sm font-medium">Campaign Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1.5">
                {["Email", "WhatsApp", "SMS", "Multi"].map((type) => (
                  <Button key={type} variant="outline" className="h-10 bg-transparent">
                    {type}
                  </Button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Target Audience</label>
              <select className="w-full p-2 rounded-lg border border-white/10 bg-muted/50 mt-1.5">
                <option>All Customers</option>
                <option>Loyalty Members</option>
                <option>Recent Purchasers</option>
                <option>Inactive Customers</option>
                <option>Custom List</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium">Message Subject</label>
              <Input placeholder="Email subject line" className="mt-1.5" />
            </div>

            <div>
              <label className="text-sm font-medium">Message Template</label>
              <Textarea placeholder="Your campaign message here..." className="mt-1.5 min-h-32" />
            </div>

            <div>
              <label className="text-sm font-medium">Schedule Date (Optional)</label>
              <Input type="datetime-local" className="mt-1.5" />
            </div>

            <div className="flex gap-2 pt-4">
              <Button className="flex-1">Create Campaign</Button>
              <Button variant="outline" onClick={() => setShowNewForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Campaigns List */}
      {campaigns.length === 0 ? (
        <Card className="glass-effect border-white/10">
          <CardContent className="pt-8 pb-8 text-center">
            <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No campaigns yet. Create your first campaign to get started.</p>
            <Button onClick={() => setShowNewForm(true)} variant="outline">
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{/* Campaign cards will render here */}</div>
      )}
    </div>
  )
}
