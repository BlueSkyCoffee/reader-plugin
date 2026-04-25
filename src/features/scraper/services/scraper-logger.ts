import type { ScraperRule } from "@/types/novel"
import { createLogger } from "@/utils/logger"

const DEBUG_ENABLED = true

export class ScraperLogger {
  private logger: ReturnType<typeof createLogger>

  constructor(private rule: ScraperRule, private scope: string) {
    this.logger = createLogger(`Scraper:${rule.name}:${scope}`)
  }

  debug(message: string, extra?: unknown) {
    if (!DEBUG_ENABLED)
      return
    if (extra === undefined) {
      this.logger.debug(message)
      return
    }
    this.logger.debug(message, extra)
  }

  info(message: string, extra?: unknown) {
    if (extra === undefined) {
      this.logger.info(message)
      return
    }
    this.logger.info(message, extra)
  }

  warn(message: string, extra?: unknown) {
    if (extra === undefined) {
      this.logger.warn(message)
      return
    }
    this.logger.warn(message, extra)
  }

  error(message: string, extra?: unknown) {
    if (extra === undefined) {
      this.logger.error(message)
      return
    }
    this.logger.error(message, extra)
  }

  child(scope: string) {
    return new ScraperLogger(this.rule, `${this.scope}:${scope}`)
  }
}
