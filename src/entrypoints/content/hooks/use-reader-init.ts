import { useEffect } from "react"
import { useBrowserStorageAtom } from "@/lib/browser-storage-atom"
import { readerSessionAtom, settingsAtom } from "@/state/store"
import { log } from "@/utils/logger"

/**
 * 初始化阅读器状态
 * - 从 storage 加载设置和会话
 * - 启动跨上下文同步监听
 */
export function useReaderInit() {
  const [settings] = useBrowserStorageAtom(settingsAtom)
  const [session] = useBrowserStorageAtom(readerSessionAtom)

  useEffect(() => {
    log.content.debug("Reader initialized", { settings, session })
  }, [settings, session])

  return { settings, session }
}
