import * as React from "react"
import { cn } from "@/shared/utils/cn"

interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div className={cn("rounded-lg border border-dashed bg-muted/50 px-6 py-10 text-center", className)}>
      {icon && (
        <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-background text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-sm font-medium text-foreground">{title}</h3>
      {description && (
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
