import * as React from "react"
import { cn } from "@/utils/cn"

interface FormSectionProps {
  title: string
  className?: string
  accentClassName?: string
  children: React.ReactNode
}

export function FormSection({
  title,
  className,
  accentClassName,
  children,
}: FormSectionProps) {
  return (
    <div className={cn("flex flex-col gap-4 border-b border-border pb-6", className)}>
      <h3
        className={cn(
          "border-l-2 border-primary pl-2 text-sm font-semibold text-foreground",
          accentClassName,
        )}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

interface FieldGroupProps {
  children: React.ReactNode
  className?: string
}

export function FieldGroup({ children, className }: FieldGroupProps) {
  return (
    <div className={cn("grid gap-4 rounded-xl border border-border/60 bg-muted/50 p-4", className)}>
      {children}
    </div>
  )
}
