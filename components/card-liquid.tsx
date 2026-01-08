import type React from "react"
import { cn } from "@/lib/utils"

interface LiquidCardProps {
  children: React.ReactNode
  className?: string
  interactive?: boolean
  glass?: boolean
}

export function LiquidCard({ children, className, interactive = false, glass = false }: LiquidCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border",
        glass ? "glass-effect" : "bg-card border-border",
        interactive && "transition-all duration-300 ease-out hover:shadow-lg hover:border-border/60 cursor-pointer",
        !interactive && "shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  )
}
