import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings-form"
import { UsersTable } from "@/components/users-table"
import { DashboardCustomization } from "@/components/settings/dashboard-customization"
import { InvoiceCustomization } from "@/components/settings/invoice-customization"
import { PrinterConfiguration } from "@/components/settings/printer-configuration"
import { ProductsCustomization } from "@/components/settings/products-customization"
import { Users } from "lucide-react"
import { GeneralSettings } from "@/components/settings/general-settings"

export default async function SettingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Get user profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Only admins can see all users
  let users = null
  if (profile?.role === "admin") {
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })
    users = data
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-serif tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your account and system preferences</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-6 gap-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="invoice">Invoice</TabsTrigger>
          <TabsTrigger value="printer">Printer</TabsTrigger>
        </TabsList>

        {/* General Tab */}
        <TabsContent value="general" className="space-y-6">
          <GeneralSettings />
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>Update your personal information</CardDescription>
              </CardHeader>
              <CardContent>
                <SettingsForm profile={profile} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
                <CardDescription>Your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Role</p>
                  <p className="font-medium capitalize">{profile?.role || "Staff"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Account Status</p>
                  <p className="font-medium">{profile?.is_active ? "Active" : "Inactive"}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Two-Factor Authentication</p>
                  <p className="font-medium">{profile?.two_factor_enabled ? "Enabled" : "Disabled"}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {profile?.role === "admin" && users && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>Manage staff accounts and permissions</CardDescription>
              </CardHeader>
              <CardContent>
                <UsersTable users={users} />
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <DashboardCustomization />
        </TabsContent>

        {/* Products Tab */}
        <TabsContent value="products" className="space-y-6">
          <ProductsCustomization />
        </TabsContent>

        {/* Invoice Tab */}
        <TabsContent value="invoice" className="space-y-6">
          <InvoiceCustomization />
        </TabsContent>

        {/* Printer Tab */}
        <TabsContent value="printer" className="space-y-6">
          <PrinterConfiguration />
        </TabsContent>
      </Tabs>
    </div>
  )
}
