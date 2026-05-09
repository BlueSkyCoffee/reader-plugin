import * as React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/utils"

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
    <div className={cn("flex flex-col gap-4 pb-6", className)}>
      <h3
        className={cn(
          "border-l-2 border-primary pl-2 text-sm font-semibold text-foreground",
          accentClassName,
        )}
      >
        {title}
      </h3>
      {children}
      <Separator />
    </div>
  )
}

interface FieldGroupProps {
  children: React.ReactNode
  className?: string
}

export function FieldGroup({ children, className }: FieldGroupProps) {
  return (
    <Card className={cn("bg-muted/50 border-border/60", className)}>
      <CardContent className="grid gap-4 p-4">
        {children}
      </CardContent>
    </Card>
  )
}
