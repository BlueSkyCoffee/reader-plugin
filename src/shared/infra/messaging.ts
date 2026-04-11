import type { ExtensionProtocolMap } from "@/shared/contracts/messages"
import { defineExtensionMessaging } from "@webext-core/messaging"

const { sendMessage, onMessage } = defineExtensionMessaging<ExtensionProtocolMap>()

export { onMessage, sendMessage }

type Handler<K extends keyof ExtensionProtocolMap>
  = ExtensionProtocolMap[K] extends (data: infer D) => Promise<infer R> | infer R
    ? (data: D) => Promise<R> | R
    : () => Promise<void> | void

export type MessageHandlers = {
  [K in keyof ExtensionProtocolMap]: Handler<K>
}

const DEFAULT_TIMEOUT_MS = 10_000

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return promise
  }

  let timeoutId: ReturnType<typeof setTimeout> | undefined
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`[Message:${label}] timeout after ${timeoutMs}ms`))
    }, timeoutMs)
  })

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }
  })
}

export async function requestMessage<K extends keyof ExtensionProtocolMap>(
  key: K,
  data?: Parameters<ExtensionProtocolMap[K]>[0],
  options?: { timeoutMs?: number },
): Promise<Awaited<ReturnType<ExtensionProtocolMap[K]>>> {
  try {
    const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS
    return await withTimeout(
      sendMessage(key, data as any),
      timeoutMs,
      String(key),
    )
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`[Message:${String(key)}] ${message}`)
  }
}

export function registerHandlers(handlers: MessageHandlers) {
  for (const key of Object.keys(handlers) as Array<keyof MessageHandlers>) {
    const handler = handlers[key]
    void (onMessage as any)(key, async ({ data }: { data: unknown }) => {
      return handler(data as any)
    })
  }
}
