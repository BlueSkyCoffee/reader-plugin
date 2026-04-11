const defaultTimeoutMs = 30000
const defaultMaxAttempts = 5

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }
    return response
  }
  finally {
    window.clearTimeout(timeoutId)
  }
}

async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts = defaultMaxAttempts,
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    }
    catch (error) {
      lastError = error
      if (attempt === maxAttempts) {
        break
      }
    }
  }
  throw lastError
}

export async function httpGetString(
  url: string,
  options: {
    headers?: Record<string, string>
    timeoutMs?: number
    decoder?: TextDecoder
    maxAttempts?: number
    credentials?: RequestCredentials
  } = {},
): Promise<string> {
  const {
    headers,
    timeoutMs = defaultTimeoutMs,
    decoder = new TextDecoder("utf-8"),
    maxAttempts = defaultMaxAttempts,
    credentials,
  } = options
  return retry(async () => {
    const response = await fetchWithTimeout(url, { headers, credentials }, timeoutMs)
    const buffer = await response.arrayBuffer()
    return decoder.decode(buffer)
  }, maxAttempts)
}

export async function httpGetBytes(
  url: string,
  options: {
    headers?: Record<string, string>
    timeoutMs?: number
    maxAttempts?: number
    credentials?: RequestCredentials
  } = {},
): Promise<Uint8Array> {
  const {
    headers,
    timeoutMs = defaultTimeoutMs,
    maxAttempts = defaultMaxAttempts,
    credentials,
  } = options
  return retry(async () => {
    const response = await fetchWithTimeout(url, { headers, credentials }, timeoutMs)
    const buffer = await response.arrayBuffer()
    return new Uint8Array(buffer)
  }, maxAttempts)
}
