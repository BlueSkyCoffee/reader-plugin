/**
 * 沙箱服务
 * 管理沙箱 iframe 的创建、通信和任务执行
 */

interface SandboxTask {
  jsCode: string
  input: string
  resolve: (result: string) => void
  reject: (error: Error) => void
}

interface SandboxResult {
  type: "sandbox-result"
  id: string
  success: boolean
  result?: string
  error?: string
}

/**
 * 沙箱服务单例
 */
export class SandboxService {
  private static instance: SandboxService
  private sandboxFrame: HTMLIFrameElement | null = null
  private pendingTasks: Map<string, SandboxTask> = new Map()
  private taskIdCounter = 0
  private isReady = false
  private readyPromise: Promise<void> | null = null

  private constructor() {}

  static getInstance(): SandboxService {
    if (!SandboxService.instance) {
      SandboxService.instance = new SandboxService()
    }
    return SandboxService.instance
  }

  /**
   * 初始化沙箱
   * 创建隐藏的 iframe 作为执行环境
   */
  async initialize(): Promise<void> {
    if (this.sandboxFrame) {
      return
    }

    this.readyPromise = new Promise<void>((resolve) => {
      // 创建沙箱 iframe
      this.sandboxFrame = document.createElement("iframe")
      this.sandboxFrame.src = "/sandbox.html"
      this.sandboxFrame.style.display = "none"
      this.sandboxFrame.style.width = "0"
      this.sandboxFrame.style.height = "0"
      this.sandboxFrame.style.border = "none"
      this.sandboxFrame.style.position = "absolute"
      this.sandboxFrame.style.top = "-9999px"
      this.sandboxFrame.style.left = "-9999px"
      // 设置 sandbox 属性，只允许脚本执行
      this.sandboxFrame.setAttribute("sandbox", "allow-scripts")

      // 监听沙箱消息
      window.addEventListener("message", this.handleMessage.bind(this))

      document.body.appendChild(this.sandboxFrame)

      // 等待沙箱就绪
      const checkReady = () => {
        if (this.isReady) {
          resolve()
        }
        else {
          setTimeout(checkReady, 50)
        }
      }
      checkReady()
    })

    return this.readyPromise
  }

  /**
   * 处理来自沙箱的消息
   */
  private handleMessage(event: MessageEvent): void {
    // 检查消息来源
    if (!this.sandboxFrame || event.source !== this.sandboxFrame.contentWindow) {
      return
    }

    const data = event.data as { type: string }

    if (data.type === "sandbox-ready") {
      this.isReady = true
      return
    }

    if (data.type === "sandbox-result") {
      const result = data as SandboxResult
      const task = this.pendingTasks.get(result.id)

      if (task) {
        this.pendingTasks.delete(result.id)

        if (result.success && result.result) {
          task.resolve(result.result)
        }
        else {
          task.reject(new Error(result.error || "Sandbox execution failed"))
        }
      }
    }
  }

  /**
   * 在沙箱中执行 JavaScript 代码
   * @param jsCode 要执行的 JS 代码
   * @param input 输入值
   * @param timeout 超时时间（毫秒）
   * @returns 执行结果
   */
  async executeJs(jsCode: string, input: string, timeout = 5000): Promise<string> {
    // 确保沙箱已初始化
    await this.initialize()

    if (!this.sandboxFrame || !this.sandboxFrame.contentWindow) {
      throw new Error("Sandbox not initialized")
    }

    const taskId = `task-${this.taskIdCounter++}`

    return new Promise<string>((resolve, reject) => {
      // 设置超时
      const timeoutId = setTimeout(() => {
        this.pendingTasks.delete(taskId)
        reject(new Error("Sandbox execution timeout"))
      }, timeout)

      // 注册任务
      this.pendingTasks.set(taskId, {
        jsCode,
        input,
        resolve: (result) => {
          clearTimeout(timeoutId)
          resolve(result)
        },
        reject: (error) => {
          clearTimeout(timeoutId)
          reject(error)
        },
      })

      // 发送执行请求到沙箱
      this.sandboxFrame!.contentWindow!.postMessage({
        type: "execute-js",
        id: taskId,
        jsCode,
        input,
      }, "*")
    })
  }

  /**
   * 销毁沙箱
   */
  destroy(): void {
    if (this.sandboxFrame) {
      window.removeEventListener("message", this.handleMessage.bind(this))
      document.body.removeChild(this.sandboxFrame)
      this.sandboxFrame = null
      this.isReady = false
      this.pendingTasks.clear()
    }
  }

  /**
   * 检查沙箱是否已就绪
   */
  isInitialized(): boolean {
    return this.isReady && this.sandboxFrame !== null
  }
}
