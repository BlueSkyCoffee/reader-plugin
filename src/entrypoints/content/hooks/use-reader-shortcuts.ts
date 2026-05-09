import { useAtomValue, useSetAtom } from "jotai"
import { useEffect } from "react"
import { useShortcutListener } from "@/hooks/use-shortcut-listener"
import { currentChapterIndexAtom, readerSessionAtom, readerVisibleAtom, scrollPositionAtom } from "@/state/store"
import { ShortcutManager } from "@/utils/shortcut-manager"

interface UseReaderShortcutsOptions {
  chapters: unknown[]
}

/**
 * 阅读器快捷键管理
 */
export function useReaderShortcuts(options: UseReaderShortcutsOptions) {
  const { chapters } = options
  const session = useAtomValue(readerSessionAtom)
  const visible = useAtomValue(readerVisibleAtom)
  const setScrollPosition = useSetAtom(scrollPositionAtom)
  const setCurrentChapterIndex = useSetAtom(currentChapterIndexAtom)
  const setVisible = useSetAtom(readerVisibleAtom)

  useEffect(() => {
    if (!visible || !session?.bookId) {
      return
    }

    ShortcutManager.setupReaderShortcuts({
      nextPage: () => setScrollPosition(prev => prev + 100),
      prevPage: () => setScrollPosition(prev => Math.max(0, prev - 100)),
      nextChapter: () => setCurrentChapterIndex(index => Math.min(chapters.length - 1, index + 1)),
      prevChapter: () => setCurrentChapterIndex(index => Math.max(0, index - 1)),
      toggleReader: () => setVisible(v => !v),
    })

    return () => {
      ShortcutManager.unbindReaderShortcuts()
    }
  }, [session?.bookId, visible, chapters.length, setScrollPosition, setCurrentChapterIndex, setVisible])

  // 用户可配置的切换阅读器快捷键（始终生效，不受 visible 限制）
  useShortcutListener("toggle_reader", () => {
    setVisible(v => !v)
  })
}
