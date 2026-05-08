import { i18n } from "#imports"
import { browser } from "wxt/browser"

/**
 * 显示下载完成通知
 */
export async function showDownloadCompleteNotification(
  bookTitle: string,
  totalChapters: number,
): Promise<string> {
  const notificationId = await browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon/128.png"),
    title: i18n.t("notification_download_complete_title"),
    message: i18n.t("notification_download_complete_message", [bookTitle, totalChapters]),
  })

  return notificationId
}

/**
 * 显示错误通知
 */
export async function showErrorNotification(
  title: string,
  message: string,
): Promise<string> {
  const notificationId = await browser.notifications.create({
    type: "basic",
    iconUrl: browser.runtime.getURL("/icon/128.png"),
    title,
    message,
  })

  return notificationId
}

/**
 * 清除通知
 */
export async function clearNotification(notificationId: string): Promise<void> {
  await browser.notifications.clear(notificationId)
}
