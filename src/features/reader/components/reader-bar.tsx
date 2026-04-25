import type { ClassValue } from "clsx"
import type { ReaderPosition, ReaderStyle } from "@/types/config"
import { clsx } from "clsx"
import * as React from "react"
import { twMerge } from "tailwind-merge"
import { useDraggable } from "@/features/reader/hooks/use-draggable"
import { i18n } from "@/i18n"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface ReaderBarProps {
  children: React.ReactNode
  position: ReaderPosition
  styleConfig: ReaderStyle
}

export function ReaderBar({ children, position, styleConfig }: ReaderBarProps) {
  const isFloating = position === "floating"
  const { ref, position: floatingPosition, handlers } = useDraggable(isFloating)

  const baseStyle: React.CSSProperties = {
    backgroundColor: styleConfig.background,
    color: styleConfig.foreground,
    borderColor: styleConfig.border,
    opacity: styleConfig.opacity,
    borderRadius: isFloating ? styleConfig.radius : 0,
    height: isFloating ? styleConfig.floatingHeight : styleConfig.barHeight,
    width: isFloating ? styleConfig.floatingWidth : "100%",
    left: isFloating ? floatingPosition.x : 0,
    top: isFloating ? floatingPosition.y : position === "top" ? 0 : undefined,
    bottom: !isFloating && position === "bottom" ? 0 : undefined,
  }

  const styleWithVars = {
    ...baseStyle,
    "--reader-accent": styleConfig.accent,
  } as React.CSSProperties

  return (
    <div
      ref={ref}
      className={cn(
        "fixed z-[9999] flex flex-col border shadow-lg backdrop-blur",
        isFloating ? "shadow-xl" : "left-0 right-0",
        isFloating ? "" : position === "top" ? "top-0 border-b" : "bottom-0 border-t",
      )}
      style={styleWithVars}
    >
      {isFloating && (
        <div
          className="flex items-center justify-between border-b px-3 py-1 text-[11px] uppercase tracking-wide cursor-move select-none"
          onPointerDown={handlers.onPointerDown}
        >
          <span className="opacity-70">{i18n.t("reader_bar_title")}</span>
          <span className="opacity-50">{i18n.t("reader_bar_dragHint")}</span>
        </div>
      )}
      {children}
    </div>
  )
}

export function ContentDisplay({
  text,
  isFetching,
  primaryColor,
  fontSize,
  lineHeight,
}: {
  text: string
  isFetching: boolean
  primaryColor: string
  fontSize: number
  lineHeight: number
}) {
  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto whitespace-pre-wrap px-4 py-2 font-mono"
      style={{ fontSize: `${fontSize}px`, lineHeight }}
    >
      {isFetching
        ? (
            <span style={{ color: primaryColor }}>{i18n.t("reader_loading")}</span>
          )
        : (
            <span className="animate-in fade-in duration-300">{text}</span>
          )}
    </div>
  )
}

export function ReaderControls({
  percent,
  currentIndex,
  totalChapters,
  onPrev,
  onNext,
}: {
  percent: string
  currentIndex: number
  totalChapters: number
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-between border-t px-4 py-2 text-xs">
      <div className="flex items-center gap-2 tabular-nums opacity-80">
        <span>
          {percent}
          %
        </span>
        <span className="opacity-40">|</span>
        <span>
          {currentIndex + 1}
          /
          {totalChapters}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="rounded px-2 py-1 transition-colors hover:bg-black/5"
          style={{ color: "var(--reader-accent)" }}
        >
          {i18n.t("reader_nav_prevChapter")}
        </button>
        <button
          onClick={onNext}
          className="rounded px-2 py-1 transition-colors hover:bg-black/5"
          style={{ color: "var(--reader-accent)" }}
        >
          {i18n.t("reader_nav_nextChapter")}
        </button>
      </div>
    </div>
  )
}
