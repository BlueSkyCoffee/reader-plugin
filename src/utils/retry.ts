/**
 * 重试机制工具函数
 * 参考 so-novel 的 ChapterParser.retry() 实现
 */

export interface RetryOptions {
  /** 最大重试次数，默认 3 */
  maxAttempts?: number
  /** 最小重试间隔（毫秒），默认 1000 */
  minInterval?: number
  /** 最大重试间隔（毫秒），默认 3000 */
  maxInterval?: number
  /** 重试回调 */
  onRetry?: (attempt: number, error: Error) => void
}

const DEFAULT_MAX_ATTEMPTS = 3
const DEFAULT_MIN_INTERVAL = 1000
const DEFAULT_MAX_INTERVAL = 3000

/**
 * 带重试的异步任务执行器
 * 递增间隔重试，模拟 so-novel 的实现
 */
export async function withRetry<T>(
  task: () => Promise<T>,
  options?: RetryOptions,
): Promise<T> {
  const maxAttempts = options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS
  const minInterval = options?.minInterval ?? DEFAULT_MIN_INTERVAL
  const maxInterval = options?.maxInterval ?? DEFAULT_MAX_INTERVAL

  // 第一次尝试
  try {
    return await task()
  }
  catch (firstError) {
    // 如果不需要重试，直接抛出
    if (maxAttempts <= 1) {
      throw firstError
    }
  }

  // 重试循环
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      // 递增间隔：attempt * random(minInterval, maxInterval)
      const baseDelay = randomInterval(minInterval, maxInterval)
      const delay = baseDelay * attempt

      await sleep(delay)

      const result = await task()
      return result
    }
    catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))

      // 调用重试回调
      options?.onRetry?.(attempt, err)

      // 最终失败时抛出错误
      if (attempt === maxAttempts) {
        throw err
      }
    }
  }

  // 理论上不会到达这里
  throw new Error("Retry exhausted")
}

/**
 * 随机间隔生成
 * 在 min 和 max 之间生成随机值
 */
function randomInterval(min: number, max: number): number {
  if (max <= min) {
    return min
  }
  return min + Math.random() * (max - min)
}

/**
 * 异步延迟
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
