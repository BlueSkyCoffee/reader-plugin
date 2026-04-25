type LogLevel = "debug" | "info" | "warn" | "error"

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
}

const IS_DEV = import.meta.env?.DEV ?? false
const MIN_LEVEL: LogLevel = IS_DEV ? "debug" : "warn"

export function createLogger(module: string) {
  const prefix = `[${module}]`

  const log = (level: LogLevel, message: string, ...args: unknown[]) => {
    if (LOG_LEVELS[level] < LOG_LEVELS[MIN_LEVEL])
      return

    // Debug/info use console.warn in dev, suppressed in production
    /* eslint-disable no-console */
    if (level === "debug") {
      console.debug(prefix, message, ...args)
    }
    else if (level === "info") {
      console.info(prefix, message, ...args)
    }
    else {
      console[level](prefix, message, ...args)
    }
    /* eslint-enable no-console */
  }

  return {
    debug: (msg: string, ...args: unknown[]) => log("debug", msg, ...args),
    info: (msg: string, ...args: unknown[]) => log("info", msg, ...args),
    warn: (msg: string, ...args: unknown[]) => log("warn", msg, ...args),
    error: (msg: string, ...args: unknown[]) => log("error", msg, ...args),
  }
}

export const log = {
  app: createLogger("App"),
  reader: createLogger("Reader"),
  bookshelf: createLogger("Bookshelf"),
  search: createLogger("Search"),
  rules: createLogger("Rules"),
  download: createLogger("Download"),
  lightnovel: createLogger("LightNovel"),
  scraper: createLogger("Scraper"),
  epub: createLogger("EPUB"),
  storage: createLogger("Storage"),
  popup: createLogger("Popup"),
  content: createLogger("Content"),
  background: createLogger("Background"),
}
