import { browser } from "wxt/browser"

const LOCK_PREFIX = "reader:lock:"
const LOCK_TIMEOUT_MS = 5000

/**
 * 检测是否支持 browser.storage.session（MV3 Chrome/Edge）
 * Firefox MV2 不支持，使用 storage.local 作为替代
 */
async function supportsSessionStorage(): Promise<boolean> {
  try {
    // 尝试访问 session storage
    if (browser.storage?.session) {
      await browser.storage.session.get("test")
      return true
    }
  }
  catch {
    // 不支持
  }
  return false
}

let _useSessionStorage: boolean | null = null

async function shouldUseSessionStorage(): Promise<boolean> {
  if (_useSessionStorage === null) {
    _useSessionStorage = await supportsSessionStorage()
  }
  return _useSessionStorage
}

/**
 * 获取存储区域（自动适配浏览器）
 */
async function getStorageArea(): Promise<"session" | "local"> {
  const useSession = await shouldUseSessionStorage()
  return useSession ? "session" : "local"
}

/**
 * 会话锁 - 防止并发写入冲突
 * 自动适配：
 * - Chrome/Edge → browser.storage.session
 * - Firefox → browser.storage.local（带前缀）
 */
export class SessionLock {
  private lockKey: string

  constructor(resourceId: string) {
    this.lockKey = `${LOCK_PREFIX}${resourceId}`
  }

  /**
   * 获取锁，执行原子操作，自动释放
   */
  async withLock<T>(operation: () => Promise<T>, timeoutMs = LOCK_TIMEOUT_MS): Promise<T> {
    const storageArea = await getStorageArea()
    const storage = storageArea === "session" ? browser.storage.session : browser.storage.local

    const lockId = `${Date.now()}:${Math.random().toString(36).slice(2)}`

    // 尝试获取锁
    const result = await storage.get(this.lockKey)
    const existingLock = result[this.lockKey] as { lockId: string, timestamp: number } | undefined

    if (existingLock && Date.now() - existingLock.timestamp < timeoutMs) {
      throw new Error("Session is locked by another operation")
    }

    // 设置锁
    await storage.set({
      [this.lockKey]: { lockId, timestamp: Date.now() },
    })

    try {
      return await operation()
    }
    finally {
      // 释放锁
      await storage.remove(this.lockKey)
    }
  }

  /**
   * 检查锁是否可用
   */
  async isAvailable(timeoutMs = LOCK_TIMEOUT_MS): Promise<boolean> {
    const storageArea = await getStorageArea()
    const storage = storageArea === "session" ? browser.storage.session : browser.storage.local

    const result = await storage.get(this.lockKey)
    const existingLock = result[this.lockKey] as { lockId: string, timestamp: number } | undefined

    if (!existingLock)
      return true
    return Date.now() - existingLock.timestamp >= timeoutMs
  }

  /**
   * 强制释放锁（用于清理）
   */
  async forceRelease(): Promise<void> {
    const storageArea = await getStorageArea()
    const storage = storageArea === "session" ? browser.storage.session : browser.storage.local
    await storage.remove(this.lockKey)
  }
}

/**
 * 创建会话锁实例
 */
export function createSessionLock(resourceId: string): SessionLock {
  return new SessionLock(resourceId)
}
