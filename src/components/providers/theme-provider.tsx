import { useAtom } from "jotai"
import { createContext, use, useCallback, useEffect, useMemo } from "react"
import { settingsAtom } from "@/state/store"
import { DEFAULT_USER_SETTINGS } from "@/types/config"

type Theme = "light" | "dark" | "system"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined" || !window.matchMedia)
    return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

interface ThemeContextI {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

export const ThemeContext = createContext<ThemeContextI | undefined>(undefined)

export function ThemeProvider({
  children,
  container,
}: {
  children: React.ReactNode
  container?: HTMLElement
}) {
  const [settings, setSettings] = useAtom(settingsAtom)
  const theme = settings.theme ?? DEFAULT_USER_SETTINGS.theme

  const resolvedTheme = useMemo(() => {
    if (theme === "system")
      return getSystemTheme()
    return theme
  }, [theme])

  const setTheme = useCallback((newTheme: Theme) => {
    setSettings(prev => ({ ...prev, theme: newTheme }))
  }, [setSettings])

  // Apply theme to document or shadow root container
  useEffect(() => {
    const target = container ?? document.documentElement
    target.classList.remove("light", "dark")
    target.classList.add(resolvedTheme)
    target.setAttribute("style", `color-scheme: ${resolvedTheme}`)
  }, [resolvedTheme, container])

  // Listen for system theme changes if in system mode
  useEffect(() => {
    if (theme !== "system")
      return

    const mq = window.matchMedia?.("(prefers-color-scheme: dark)")
    if (!mq)
      return

    const onChange = () => {
      // Force re-calculation of resolvedTheme via state update
      setSettings(prev => ({ ...prev, theme: "system" }))
    }

    mq.addEventListener?.("change", onChange)
    return () => mq.removeEventListener?.("change", onChange)
  }, [theme, setSettings])

  const contextValue = useMemo(() => ({
    theme,
    resolvedTheme,
    setTheme,
  }), [theme, resolvedTheme, setTheme])

  return (
    <ThemeContext value={contextValue}>
      {children}
    </ThemeContext>
  )
}

export function useTheme(): ThemeContextI {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
