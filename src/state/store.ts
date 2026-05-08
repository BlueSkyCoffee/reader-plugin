import type { UserSettings } from "@/types/config"
import { atom } from "jotai"
import { STORAGE_KEYS } from "@/constants/storage"
import { createBrowserStorageAtom, createSessionAtom } from "@/lib/browser-storage-atom"
import { DEFAULT_USER_SETTINGS } from "@/types/config"

/**
 * 阅读会话状态
 * 统一的会话状态，替代之前的分散状态
 */
export interface ReaderSession {
  bookId: string | null
  title: string
  author: string
  totalChapters: number
  chapterIndex: number
  scrollPosition: number
}

const DEFAULT_SESSION: ReaderSession = {
  bookId: null,
  title: "",
  author: "",
  totalChapters: 0,
  chapterIndex: 0,
  scrollPosition: 0,
}

/**
 * 用户设置 atom - 自动跨上下文同步
 * UI/Content/Background 任意修改都会自动传播
 */
export const settingsAtom = createBrowserStorageAtom<UserSettings>({
  key: STORAGE_KEYS.appSettings,
  defaultValue: DEFAULT_USER_SETTINGS,
})

/**
 * 阅读会话 atom - 自动跨上下文同步
 * 包含当前阅读的所有状态：书籍、章节、滚动位置
 */
export const readerSessionAtom = createBrowserStorageAtom<ReaderSession>({
  key: STORAGE_KEYS.activeReaderSession,
  defaultValue: DEFAULT_SESSION,
})

/**
 * 当前章节索引 - 从 readerSessionAtom 派生
 * 修改时会同步更新 session
 */
export const currentChapterIndexAtom = atom(
  (get) => {
    const session = get(readerSessionAtom)
    return session.chapterIndex
  },
  (get, set, update: number | ((prev: number) => number)) => {
    const session = get(readerSessionAtom)
    const newIndex = typeof update === "function"
      ? update(session.chapterIndex)
      : update

    set(readerSessionAtom, {
      ...session,
      chapterIndex: newIndex,
    })
  },
)

/**
 * 滚动位置 - 从 readerSessionAtom 派生
 * 修改时会同步更新 session
 */
export const scrollPositionAtom = atom(
  (get) => {
    const session = get(readerSessionAtom)
    return session.scrollPosition
  },
  (get, set, update: number | ((prev: number) => number)) => {
    const session = get(readerSessionAtom)
    const newScroll = typeof update === "function"
      ? update(session.scrollPosition)
      : update

    set(readerSessionAtom, {
      ...session,
      scrollPosition: newScroll,
    })
  },
)

/**
 * 当前书籍 ID - 从 readerSessionAtom 派生
 */
export const activeBookIdAtom = atom(
  get => get(readerSessionAtom).bookId,
)

/**
 * 阅读器可见状态 - 会话级，不需要持久化
 */
export const readerVisibleAtom = createSessionAtom<boolean>(true)

/**
 * 阅读器加载状态
 */
export const readerLoadingAtom = createSessionAtom<boolean>(false)
