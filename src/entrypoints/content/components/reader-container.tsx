import { useAtom } from "jotai"
import * as React from "react"
import { ContentDisplay, ReaderBar, ReaderControls } from "@/features/reader"
import { readerSessionAtom, readerVisibleAtom } from "@/state/store"
import { DEFAULT_USER_SETTINGS } from "@/types/config"
import { useChapterFetcher } from "../hooks/use-chapter-fetcher"
import { useExclusionCheck } from "../hooks/use-exclusion-check"
import { usePageInset } from "../hooks/use-page-inset"
import { useReaderInit } from "../hooks/use-reader-init"
import { useReaderSession } from "../hooks/use-reader-session"
import { useReaderShortcuts } from "../hooks/use-reader-shortcuts"

/**
 * 阅读器容器组件
 * 组合所有 hooks 并渲染阅读器 UI
 */
export function ReaderContainer() {
  const { settings } = useReaderInit()
  const isExcluded = useExclusionCheck()
  useReaderSession() // 初始化会话监听

  const { chapters, currentChapter, isFetching, currentIndex } = useChapterFetcher()
  useReaderShortcuts({ chapters }) // 快捷键

  const [session] = useAtom(readerSessionAtom)
  const [visible] = useAtom(readerVisibleAtom)

  // 合并设置
  const resolvedSettings = React.useMemo(
    () => ({
      ...DEFAULT_USER_SETTINGS,
      ...settings,
      readerStyle: {
        ...DEFAULT_USER_SETTINGS.readerStyle,
        ...settings.readerStyle,
      },
    }),
    [settings],
  )

  const shouldRender = !isExcluded && !!session?.bookId && visible

  // 页面 inset 调整
  usePageInset({
    position: resolvedSettings.position,
    barHeight: resolvedSettings.readerStyle.barHeight,
    enabled: shouldRender,
  })

  if (!shouldRender) {
    return null
  }

  const displayText = currentChapter?.content || (isFetching ? "Loading..." : "No content")

  return (
    <ReaderBar position={resolvedSettings.position} styleConfig={resolvedSettings.readerStyle}>
      <ContentDisplay
        text={displayText}
        isFetching={isFetching}
        primaryColor={resolvedSettings.readerStyle.accent}
        fontSize={resolvedSettings.fontSize}
        lineHeight={resolvedSettings.lineHeight}
      />
      <ReaderControls
        percent="0"
        currentIndex={currentIndex}
        totalChapters={chapters.length}
        onPrev={() => {
          // 通过 atom 更新
        }}
        onNext={() => {
          // 通过 atom 更新
        }}
      />
    </ReaderBar>
  )
}
