import type { PrimitiveAtom } from "jotai"
import { atom, useAtom, useSetAtom } from "jotai"
import { useEffect } from "react"
import { browser } from "wxt/browser"

interface BrowserStorageConfig<T> {
  key: string
  defaultValue: T
}

/**
 * 创建与 browser.storage 自动同步的 atom
 * 使用方式：
 * 1. 创建 atom: const myAtom = createBrowserStorageAtom({ key: 'my-key', defaultValue: {} })
 * 2. 在组件中使用: useBrowserStorageAtom(myAtom)
 */
export function createBrowserStorageAtom<T>(
  config: BrowserStorageConfig<T>,
): PrimitiveAtom<T> & { key: string, defaultValue: T } {
  const { key, defaultValue } = config

  const baseAtom = atom<T>(defaultValue)

  // 创建一个派生 atom，读写时自动同步 storage
  const storageAtom = atom<T, [T | ((prev: T) => T)], void>(
    get => get(baseAtom),
    (get, set, update) => {
      const prevValue = get(baseAtom)
      const newValue = typeof update === "function"
        ? (update as (prev: T) => T)(prevValue)
        : update
      set(baseAtom, newValue)
      void browser.storage.local.set({ [key]: newValue })
    },
  )

  return Object.assign(storageAtom, { key, defaultValue }) as PrimitiveAtom<T> & {
    key: string
    defaultValue: T
  }
}

/**
 * React hook：初始化并监听 browser.storage 变化
 * 自动处理：
 * - 初始化时从 storage 加载值
 * - 监听其他上下文的变更
 */
export function useBrowserStorageAtom<T>(
  storageAtom: PrimitiveAtom<T> & { key: string, defaultValue: T },
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useAtom(storageAtom)
  const { key } = storageAtom

  // 初始化：从 storage 加载
  useEffect(() => {
    const loadInitialValue = async () => {
      try {
        const result = await browser.storage.local.get(key)
        if (result[key] !== undefined) {
          setValue(result[key] as T)
        }
      }
      catch (error) {
        console.error(`[BrowserStorageAtom] Load failed for ${key}:`, error)
      }
    }
    void loadInitialValue()
  }, [key, setValue])

  // 监听：其他上下文的变更
  useEffect(() => {
    const handleChange = (
      changes: Record<string, { newValue?: unknown, oldValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName !== "local")
        return

      const change = changes[key]
      if (change?.newValue !== undefined) {
        // 避免循环更新：只在新值与当前值不同时更新
        const newValue = change.newValue as T
        if (JSON.stringify(value) !== JSON.stringify(newValue)) {
          setValue(newValue)
        }
      }
    }

    browser.storage.onChanged.addListener(handleChange)
    return () => browser.storage.onChanged.removeListener(handleChange)
  }, [key, value, setValue])

  return [value, setValue]
}

/**
 * 仅读取版本的 hook
 */
export function useBrowserStorageValue<T>(
  storageAtom: PrimitiveAtom<T> & { key: string, defaultValue: T },
): T {
  const [value] = useBrowserStorageAtom(storageAtom)
  return value
}

/**
 * 仅写入版本的 hook
 */
export function useSetBrowserStorage<T>(
  storageAtom: PrimitiveAtom<T> & { key: string },
): (value: T | ((prev: T) => T)) => void {
  const setValue = useSetAtom(storageAtom)
  const key = storageAtom.key

  // 监听变更（不更新本地值，仅用于触发重新渲染）
  useEffect(() => {
    const handleChange = (
      changes: Record<string, { newValue?: unknown }>,
      areaName: string,
    ) => {
      if (areaName !== "local" && changes[key]?.newValue !== undefined) {
        setValue(changes[key].newValue as T)
      }
    }

    browser.storage.onChanged.addListener(handleChange)
    return () => browser.storage.onChanged.removeListener(handleChange)
  }, [key, setValue])

  return setValue
}

/**
 * 创建会话级 atom（不持久化，仅当前上下文有效）
 */
export function createSessionAtom<T>(defaultValue: T): PrimitiveAtom<T> {
  return atom<T>(defaultValue)
}
