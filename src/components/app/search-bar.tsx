import { Search } from "lucide-react"
import * as React from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/utils/cn"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void
  action?: React.ReactNode
  className?: string
  inputClassName?: string
  actionClassName?: string
  inputProps?: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">
}

export function SearchBar({
  value,
  onChange,
  placeholder = "搜索...",
  onSubmit,
  action,
  className,
  inputClassName,
  actionClassName,
  inputProps,
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className={cn("relative group", className)}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
      <Input
        {...inputProps}
        type={inputProps?.type ?? "search"}
        value={value}
        onChange={event => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn("pl-9 bg-background", inputClassName)}
      />
      {action && (
        <div className={cn("absolute right-2 top-1/2 -translate-y-1/2", actionClassName)}>
          {action}
        </div>
      )}
    </form>
  )
}
