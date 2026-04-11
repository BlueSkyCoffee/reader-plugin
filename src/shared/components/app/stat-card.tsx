import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface StatCardProps {
  label: string
  value: React.ReactNode
  className?: string
  valueClassName?: string
}

export function StatCard({ label, value, className, valueClassName }: StatCardProps) {
  return (
    <div className={cn("rounded-lg border bg-card p-4", className)}>
      <div className="mb-2 text-xs text-muted-foreground">{label}</div>
      <div className={cn("text-2xl font-bold text-foreground", valueClassName)}>{value}</div>
    </div>
  )
}

interface StatGridProps {
  children: React.ReactNode
  className?: string
}

export function StatGrid({ children, className }: StatGridProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-4 md:grid-cols-4", className)}>
      {children}
    </div>
  )
}
