import type { ReaderPosition } from "@/types/config"
import { useEffect, useRef } from "react"

interface UsePageInsetOptions {
  position: ReaderPosition
  barHeight: number
  enabled: boolean
}

/**
 * 页面 inset 调整 hook
 * 为阅读器预留页面空间
 */
export function usePageInset(options: UsePageInsetOptions) {
  const { position, barHeight, enabled } = options
  const restoreRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    restoreRef.current?.()
    restoreRef.current = null

    if (!enabled || position === "floating") {
      return
    }

    const side = position === "top" ? "Top" : "Bottom"
    const body = document.body
    const html = document.documentElement
    const bodyPaddingKey = `padding${side}` as "paddingTop" | "paddingBottom"
    const scrollPaddingKey = `scrollPadding${side}` as "scrollPaddingTop" | "scrollPaddingBottom"
    const originalBodyPadding = body.style[bodyPaddingKey]
    const originalHtmlScrollPadding = html.style[scrollPaddingKey]
    const computedPadding = Number.parseFloat(getComputedStyle(body)[bodyPaddingKey]) || 0
    const computedScrollPadding = Number.parseFloat(getComputedStyle(html)[scrollPaddingKey]) || 0
    const height = Math.max(0, barHeight)

    body.style[bodyPaddingKey] = `${computedPadding + height}px`
    html.style[scrollPaddingKey] = `${computedScrollPadding + height}px`

    restoreRef.current = () => {
      body.style[bodyPaddingKey] = originalBodyPadding
      html.style[scrollPaddingKey] = originalHtmlScrollPadding
    }

    return () => {
      restoreRef.current?.()
      restoreRef.current = null
    }
  }, [barHeight, enabled, position])
}
