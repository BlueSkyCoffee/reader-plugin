import { AppSidebar } from "@/components/app/sidebar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"

export function OptionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider className="h-screen w-screen">
      <TooltipProvider>
        <AppSidebar />
        {children}
        <Toaster />
      </TooltipProvider>
    </SidebarProvider>
  )
}
