import * as React from "react"
import { cn } from "@/utils"

interface MiniCardProps {
  children: React.ReactNode
  className?: string
}

export function MiniCard({ children, className }: MiniCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-3 shadow-sm", className)}>
      {children}
    </div>
  )
}
