import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { DashboardHeader } from "@/components/dashboard-header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const userInfo = {
    email: user.email || "",
    full_name: profile?.full_name,
    role: profile?.role,
  }

  return (
    <div className="flex min-h-screen w-full flex-col">
      <DashboardHeader user={userInfo} />
      <main className="flex-1 overflow-auto p-6">{children}</main>
    </div>
  )
}
