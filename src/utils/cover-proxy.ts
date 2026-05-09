import { requestMessage } from "@/lib/messaging"
import { log } from "./logger"

/**
 * 通过后台脚本代理获取封面图片，绕过 CORS/防盗链限制
 * 返回 base64 data URL，可直接用于 <img src>
 */
export async function fetchCoverAsDataUrl(coverUrl: string): Promise<string | undefined> {
  if (!coverUrl)
    return undefined

  // 已经是 data URL，直接返回
  if (coverUrl.startsWith("data:"))
    return coverUrl

  try {
    const referer = new URL(coverUrl).origin
    const dataUrl = await requestMessage("fetchImage", {
      url: coverUrl,
      referer,
    })
    return dataUrl
  }
  catch (error) {
    log.storage.warn("Cover proxy fetch failed, using original URL", error)
    return coverUrl
  }
}
