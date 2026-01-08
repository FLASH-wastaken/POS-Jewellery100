/*
  DASHBOARD SETTINGS PAGE
  
  Allows users to customize their dashboard experience
*/

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { DashboardCustomization } from "@/components/settings/dashboard-customization"

export default async function DashboardSettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold">Dashboard Settings</h1>
        <p className="text-muted-foreground">Customize your dashboard layout and metrics</p>
      </div>

      <DashboardCustomization />
    </div>
  )
}
