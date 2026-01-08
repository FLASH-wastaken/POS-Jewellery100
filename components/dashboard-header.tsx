"use client"

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"
import React from "react"

interface DashboardHeaderProps {
  user: {
    email: string
    full_name?: string
    role?: string
  }
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    const segments = pathname?.split("/").filter(Boolean) || []
    return segments.map((segment, index) => {
      const path = `/${segments.slice(0, index + 1).join("/")}`
      const title = segment.charAt(0).toUpperCase() + segment.slice(1)
      return { title, path, isLast: index === segments.length - 1 }
    })
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border/50 bg-card/30 backdrop-blur-sm px-4 transition-all duration-300 ease-out">
      <Breadcrumb>
        <BreadcrumbList>
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.path}>
              {index > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {crumb.isLast ? (
                  <BreadcrumbPage>{crumb.title}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink href={crumb.path} className="transition-all duration-300 ease-out hover:text-primary">
                    {crumb.title}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="ml-auto flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-foreground">{user.full_name || user.email}</p>
          <p className="text-xs text-muted-foreground capitalize">{user.role || "Staff"}</p>
        </div>
      </div>
    </header>
  )
}
