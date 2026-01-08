"use client"

import type React from "react"
import { MessageSquare } from "lucide-react"
import { useState } from "react"
import { X, Home, Package, Users, ShoppingBag, Settings, Tag, FileText, ChevronRight, BarChart3 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export function AppNavWrapper({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Don't show nav on auth pages
  const isAuthPage = pathname?.startsWith("/auth")

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/products", label: "Products", icon: Package },
    { href: "/customers", label: "Customers", icon: Users },
    { href: "/crm", label: "CRM", icon: MessageSquare },
    { href: "/pos", label: "Invoicing", icon: ShoppingBag } /* Create invoices for immediate sales */,
    { href: "/memos", label: "Memos", icon: FileText } /* Create and manage pending memos */,
    { href: "/sales", label: "Sales History", icon: BarChart3 } /* View all transactions */,
    { href: "/reports", label: "Reports", icon: BarChart3 } /* Analytics and insights */,
    { href: "/label-generation", label: "Labels", icon: Tag },
    { href: "/settings", label: "Settings", icon: Settings },
  ]

  return (
    <>
      {!isAuthPage && (
        <>
          {!isOpen && (
            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-40">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-r-full h-16 w-12 glass-effect border-r border-white/20 hover:glass-effect-strong transition-all duration-300 shadow-lg"
                onClick={() => setIsOpen(true)}
                title="Open navigation"
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          )}

          {/* Close button when drawer is open */}
          {isOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="fixed top-4 left-4 z-50 rounded-full glass-effect hover:glass-effect-strong transition-all duration-300"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          )}

          {/* Backdrop */}
          {isOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
              onClick={() => setIsOpen(false)}
            />
          )}

          {/* Drawer */}
          <nav
            className={cn(
              "fixed left-0 top-0 h-screen w-64 z-45 glass-effect border-r border-white/20 transition-all duration-300 ease-out flex flex-col",
              isOpen ? "translate-x-0" : "-translate-x-full",
            )}
          >
            {/* Header */}
            <div className="p-6 border-b border-white/10">
              <h2 className="text-2xl font-serif font-bold gradient-text">Jewellery100</h2>
              <p className="text-xs text-muted-foreground mt-1">Premium POS System</p>
            </div>

            {/* Navigation Links */}
            <div className="flex-1 overflow-auto p-4 space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")

                return (
                  <Link key={item.href} href={item.href} onClick={() => setIsOpen(false)}>
                    <div
                      className={cn(
                        "flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-out cursor-pointer",
                        isActive
                          ? "bg-primary/20 text-primary font-medium shadow-md"
                          : "text-foreground/70 hover:bg-muted/50 hover:text-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span>{item.label}</span>
                      </div>
                      {isActive && <ChevronRight className="h-4 w-4" />}
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-white/10">
              <p className="text-xs text-muted-foreground text-center">Premium Jewelry POS</p>
            </div>
          </nav>
        </>
      )}

      {children}
    </>
  )
}
