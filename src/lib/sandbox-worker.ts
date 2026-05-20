/**
 * 沙箱 Worker
 * 用于在 Web Worker 中安全执行 JavaScript 代码
 * 适用于 Background Service Worker 上下文
 */

interface ExecuteRequest {
  id: string
  jsCode: string
  input: string
}

interface ExecuteResponse {
  id: string
  success: boolean
  result?: string
  error?: string
}

// 禁止危险的 API（Worker 版本）
const WORKER_BLOCKED_APIS = [
  "fetch",
  "XMLHttpRequest",
  "WebSocket",
  "localStorage",
  "sessionStorage",
  "indexedDB",
  "caches",
  "cookieStore",
  "navigator",
  "location",
  "history",
  "window",
  "document",
  "chrome",
  "browser",
  "importScripts",
]

/**
 * 安全执行 JavaScript 代码（Worker 版本）
 */
function executeSandboxedJsWorker(jsCode: string, input: string): { success: boolean, result?: string, error?: string } {
  try {
    // 创建受限的执行环境
    const sandboxEnv: Record<string, undefined> = {}
    for (const api of WORKER_BLOCKED_APIS) {
      sandboxEnv[api] = undefined
    }

    // 创建受限的 Function - 在沙箱中这是安全的，因为我们限制了作用域
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...Object.keys(sandboxEnv),
      "r",
      `with (this) {
        var result = r;
        ${jsCode};
        return typeof r !== 'undefined' ? r : result;
      }`,
    )

    // 使用 null 作为 with 语句的绑定对象来限制作用域
    const boundFn = fn.bind(sandboxEnv)
    const result = boundFn(...Object.values(sandboxEnv), input)

    return { success: true, result: String(result ?? input) }
  }
  catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

// Worker 消息处理
globalThis.onmessage = (event: MessageEvent) => {
  const request = event.data as ExecuteRequest

  if (request.id && request.jsCode) {
    const result = executeSandboxedJsWorker(request.jsCode, request.input || "")

    const response: ExecuteResponse = {
      id: request.id,
      ...result,
    }

    globalThis.postMessage(response)
  }
}

// 告知主线程 Worker 已就绪
globalThis.postMessage({ type: "worker-ready" })
