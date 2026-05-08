import type { BroadcastEventType } from "@/lib/contracts/messages"
import { browser } from "wxt/browser"

const BROADCAST_CHANNEL = "reader:broadcast"

/**
 * 广播服务
 * Background 发送，UI/Content 接收
 */
export class BroadcastService {
  /**
   * 发送广播（Background 调用）
   */
  static async emit<T>(type: BroadcastEventType, data: T): Promise<void> {
    const message = { action: BROADCAST_CHANNEL, payload: { type, data } }

    // 发送到所有监听的上下文
    try {
      await browser.runtime.sendMessage(message)
    }
    catch {
      // 可能没有监听者，忽略错误
    }
  }

  /**
   * 监听广播（UI/Content 调用）
   * 返回取消监听函数
   */
  static onMessage<T>(
    type: BroadcastEventType,
    handler: (data: T) => void,
  ): () => void {
    const listener = (message: { action?: string, payload?: { type: string, data: T } }) => {
      if (message.action === BROADCAST_CHANNEL && message.payload?.type === type) {
        handler(message.payload.data)
      }
    }

    browser.runtime.onMessage.addListener(listener)

    return () => browser.runtime.onMessage.removeListener(listener)
  }

  /**
   * 监听所有广播事件
   */
  static onAllMessages(
    handler: (type: BroadcastEventType, data: unknown) => void,
  ): () => void {
    const listener = (message: { action?: string, payload?: { type: BroadcastEventType, data: unknown } }) => {
      if (message.action === BROADCAST_CHANNEL && message.payload) {
        handler(message.payload.type, message.payload.data)
      }
    }

    browser.runtime.onMessage.addListener(listener)

    return () => browser.runtime.onMessage.removeListener(listener)
  }
}
