/**
 * 阅读器事件处理服务
 */

export interface ShowReaderEventDetail {
  bookId: string
  chapterIndex?: number
  scroll?: number
  scrollPosition?: number
}

/**
 * 监听 show-reader 自定义事件
 */
export function handleShowReaderEvent(
  handler: (detail: ShowReaderEventDetail) => void,
): () => void {
  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<ShowReaderEventDetail>
    handler(customEvent.detail)
  }

  window.addEventListener("show-reader", listener)
  return () => window.removeEventListener("show-reader", listener)
}

/**
 * 触发 show-reader 事件
 */
export function dispatchShowReaderEvent(detail: ShowReaderEventDetail): void {
  const event = new CustomEvent("show-reader", { detail })
  window.dispatchEvent(event)
}
