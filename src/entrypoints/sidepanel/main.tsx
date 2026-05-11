import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { Provider as JotaiProvider } from "jotai"
import * as React from "react"
import ReactDOM from "react-dom/client"
import { ThemeProvider } from "@/components/providers/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import App from "./app.tsx"
import "@/assets/styles/theme.css"

const queryClient = new QueryClient()

const root = document.getElementById("root")!
root.className = "antialiased bg-background h-screen w-screen overflow-hidden"

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <JotaiProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <App />
          <Toaster />
        </ThemeProvider>
      </QueryClientProvider>
    </JotaiProvider>
  </React.StrictMode>,
)
