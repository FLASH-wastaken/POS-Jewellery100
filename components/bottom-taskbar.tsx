"use client"

import type React from "react"

import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  X,
  Home,
  Package,
  Users,
  ShoppingBag,
  FileText,
  BarChart3,
  Tag,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { usePageHistory } from "@/lib/page-history-context"
import { useState, useEffect } from "react"

/* 
  DEVELOPER NOTES: Bottom Taskbar Component
  Displays navigation controls, open page tabs, and current time/date.
  Shows back/forward buttons, a list of open pages as clickable tabs,
  and a real-time clock on the right side.
  
  Features:
  - Back/Forward navigation
  - Open page tabs with close button
  - Real-time date/time display
  - Responsive design with glass effect
*/

const iconMap: Record<string, React.ComponentType<any>> = {
  Home,
  Package,
  Users,
  ShoppingBag,
  FileText,
  BarChart3,
  Tag,
  Settings,
}

export function BottomTaskbar() {
  const router = useRouter()
  const { openPages, closePage } = usePageHistory()
  const [currentTime, setCurrentTime] = useState<string>("")
  const [currentDate, setCurrentDate] = useState<string>("")

  /* DEVELOPER NOTE: Update clock every second */
  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setCurrentTime(now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }))
      setCurrentDate(now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }))
    }

    updateTime()
    const interval = setInterval(updateTime, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 glass-effect border-t border-white/20">
      <div className="flex items-center justify-between px-4 py-3 gap-4">
        {/* Left Side: Navigation Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg hover:glass-effect-strong transition-all duration-300"
            onClick={() => router.back()}
            title="Go back to previous page"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-lg hover:glass-effect-strong transition-all duration-300"
            onClick={() => router.forward()}
            title="Go forward to next page"
          >
            <ArrowRight className="h-5 w-5" />
          </Button>

          {/* Divider */}
          <div className="h-6 w-px bg-white/20 mx-2" />
        </div>

        <div className="flex-1 overflow-x-auto flex items-center gap-1">
          {openPages.length > 0 ? (
            openPages.map((page) => {
              const IconComponent = iconMap[page.icon] || FileText
              return (
                <div
                  key={page.path}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg glass-effect border border-white/10 hover:glass-effect-strong transition-all duration-300 cursor-pointer group whitespace-nowrap text-sm"
                  onClick={() => router.push(page.path)}
                >
                  <IconComponent className="h-4 w-4" />
                  <span className="text-xs text-foreground/80">{page.name}</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      closePage(page.path)
                    }}
                    className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Close tab"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )
            })
          ) : (
            <span className="text-xs text-muted-foreground">No open pages</span>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-foreground/70 whitespace-nowrap">
          <span>{currentDate}</span>
          <span className="font-mono font-semibold">{currentTime}</span>
        </div>
      </div>
    </div>
  )
}
