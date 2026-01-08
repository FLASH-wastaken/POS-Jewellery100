"use client"

import { Package, ShoppingCart, Users, FileText, Settings, LogOut, Gem, Home, Barcode, Receipt } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"

const menuItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: Home,
    description: "Overview & analytics",
  },
  {
    title: "Point of Sale",
    url: "/pos",
    icon: Receipt,
    description: "Create invoices & memos",
  },
  {
    title: "Sales",
    url: "/sales",
    icon: ShoppingCart,
    description: "Transactions & POS",
  },
  {
    title: "Products",
    url: "/products",
    icon: Package,
    description: "Inventory management",
  },
  {
    title: "Label Generation",
    url: "/label-generation",
    icon: Barcode,
    description: "Print product labels",
  },
  {
    title: "Customers",
    url: "/customers",
    icon: Users,
    description: "Customer database",
  },
  {
    title: "Reports",
    url: "/reports",
    icon: FileText,
    description: "Business insights",
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    description: "System configuration",
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push("/auth/login")
  }

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 shadow-lg">
            <Gem className="h-7 w-7 text-primary-foreground" />
          </div>
          <div>
            <h2 className="font-serif text-xl font-bold text-sidebar-foreground">Jewellery100</h2>
            <p className="text-xs text-sidebar-foreground/70 font-medium">Premium POS System</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = pathname === item.url || pathname?.startsWith(`${item.url}/`)
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive} className="h-auto py-3">
                      <Link href={item.url}>
                        <item.icon className="h-5 w-5" />
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{item.title}</span>
                          <span className="text-[10px] text-sidebar-foreground/60">{item.description}</span>
                        </div>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-4">
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </SidebarFooter>
    </Sidebar>
  )
}
