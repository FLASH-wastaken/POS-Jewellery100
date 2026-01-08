/*
  CRM PAGE - Customer Relationship Management
  
  Features:
  - Campaign Management: Create and manage marketing campaigns
  - Communication Tracking: Track all customer communications
  - Automated Reminders: Send reminders to memo holders before due dates
  - Customer Outreach: Send messages via WhatsApp, Email, or SMS
  
  For developers: This page aggregates all CRM functionality
*/

"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, Send, Calendar, Clock } from "lucide-react"
import { CampaignsTab } from "@/components/crm/campaigns-tab"
import { CommunicationsTab } from "@/components/crm/communications-tab"
import { RemindersTab } from "@/components/crm/reminders-tab"

export default function CRMPage() {
  const [activeTab, setActiveTab] = useState("campaigns")

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-muted/50 to-background p-6 pb-20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-xl bg-primary/10 glass-effect">
              <MessageSquare className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">CRM System</h1>
              <p className="text-muted-foreground">Manage campaigns, communications, and customer outreach</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-effect border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">campaigns running</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Communications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">sent this month</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reminders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground mt-1">waiting to be sent</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 glass-effect border-white/10">
            <TabsTrigger value="campaigns" className="gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Campaigns</span>
            </TabsTrigger>
            <TabsTrigger value="communications" className="gap-2">
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Communications</span>
            </TabsTrigger>
            <TabsTrigger value="reminders" className="gap-2">
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Reminders</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-6">
            <CampaignsTab />
          </TabsContent>

          <TabsContent value="communications" className="mt-6">
            <CommunicationsTab />
          </TabsContent>

          <TabsContent value="reminders" className="mt-6">
            <RemindersTab />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
