/**
 * 沙箱执行环境
 * 用于安全执行爬虫规则中的 JavaScript 代码
 *
 * 安全限制：
 * - 无网络访问（fetch/XHR 被禁止）
 * - 无存储访问（localStorage/IndexedDB 被禁止）
 * - 无 DOM 访问（document 被限制）
 * - 无扩展 API 访问
 */

// 禁止危险的 API
const SANDBOX_BLOCKED_APIS = [
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
]

// 创建受限的执行环境
function createSandboxEnvironment(): Record<string, undefined> {
  const env: Record<string, undefined> = {}

  // 将所有危险 API 设置为 undefined
  for (const api of SANDBOX_BLOCKED_APIS) {
    env[api] = undefined
  }

  return env
}

const sandboxEnv = createSandboxEnvironment()

/**
 * 安全执行 JavaScript 代码（iframe 沙箱版本）
 * @param jsCode 要执行的 JS 代码
 * @param input 输入值（通过 'r' 变量传递）
 * @returns 执行结果
 */
function executeSandboxedJsIframe(jsCode: string, input: string): { success: boolean, result?: string, error?: string } {
  try {
    // 创建受限的 Function - 在沙箱中这是安全的，因为我们限制了作用域
    // eslint-disable-next-line no-new-func
    const fn = new Function(
      ...Object.keys(sandboxEnv),
      "r",
      `with (sandboxEnv) {
        var result = r;
        ${jsCode};
        return typeof r !== 'undefined' ? r : result;
      }`,
    )

    // 执行代码
    const result = fn(...Object.values(sandboxEnv), input)

    return { success: true, result: String(result) }
  }
  catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * 处理来自主进程的消息
 */
window.addEventListener("message", (event) => {
  // 只接受来自扩展内部的消息
  if (event.source !== window.parent) {
    return
  }

  const { type, id, jsCode, input } = event.data

  if (type === "execute-js") {
    const result = executeSandboxedJsIframe(jsCode, input)

    // 发送结果回主进程
    window.parent.postMessage({
      type: "sandbox-result",
      id,
      ...result,
    }, "*")
  }
})

// 告知主进程沙箱已就绪
window.parent.postMessage({ type: "sandbox-ready" }, "*")
