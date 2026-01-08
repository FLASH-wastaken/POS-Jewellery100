"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { usePathname } from "next/navigation"

/* 
  DEVELOPER NOTES: Page History Context
  This context tracks the user's page navigation history and provides it to components.
  It maintains a list of recently visited pages (up to 10) with their names and paths.
  
  Usage: 
    const { openPages, closePage } = usePageHistory()
    Opens pages are stored in order of visit with current page at the end.
*/

export interface OpenPage {
  path: string
  name: string
  icon: string
}

interface PageHistoryContextType {
  openPages: OpenPage[]
  closePage: (path: string) => void
  navigateToPage: (path: string) => void
}

const PageHistoryContext = createContext<PageHistoryContextType | undefined>(undefined)

const pathToPageMap: Record<string, { name: string; icon: string }> = {
  "/dashboard": { name: "Dashboard", icon: "Home" },
  "/products": { name: "Products", icon: "Package" },
  "/customers": { name: "Customers", icon: "Users" },
  "/pos": { name: "Invoicing", icon: "ShoppingBag" },
  "/memos": { name: "Memos", icon: "FileText" },
  "/sales": { name: "Sales History", icon: "BarChart3" },
  "/reports": { name: "Reports", icon: "BarChart3" },
  "/label-generation": { name: "Labels", icon: "Tag" },
  "/settings": { name: "Settings", icon: "Settings" },
}

export function PageHistoryProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [openPages, setOpenPages] = useState<OpenPage[]>([])

  /* DEVELOPER NOTE: Update open pages when pathname changes */
  useEffect(() => {
    if (!pathname || pathname.startsWith("/auth")) return

    setOpenPages((prev) => {
      /* Remove current page if already open, then add it to the end */
      const filtered = prev.filter((p) => p.path !== pathname)

      /* Get page info from mapping or use pathname as fallback */
      const pageInfo = pathToPageMap[pathname] || {
        name: pathname.split("/").pop()?.replace("-", " ") || "Page",
        icon: "FileText",
      }

      const newPage: OpenPage = {
        path: pathname,
        name: pageInfo.name,
        icon: pageInfo.icon,
      }

      /* Keep only last 10 pages */
      return [...filtered, newPage].slice(-10)
    })
  }, [pathname])

  const closePage = (path: string) => {
    setOpenPages((prev) => prev.filter((p) => p.path !== path))
  }

  const navigateToPage = (path: string) => {
    /* Navigation handled by Next.js routing in component */
  }

  return (
    <PageHistoryContext.Provider value={{ openPages, closePage, navigateToPage }}>
      {children}
    </PageHistoryContext.Provider>
  )
}

export function usePageHistory() {
  const context = useContext(PageHistoryContext)
  if (!context) {
    throw new Error("usePageHistory must be used within PageHistoryProvider")
  }
  return context
}
