export function getFileName(url: string): string {
  const start = url.lastIndexOf("/")
  const end = url.lastIndexOf("?")
  if (start < 0 && end < 0) {
    return url
  }
  if (start < 0) {
    return url.substring(0, end)
  }
  if (end < 0) {
    return url.substring(start + 1)
  }
  return url.substring(start + 1, end)
}

export function resolveBaseUrl(baseUrl: string, relativeUrl: string): string {
  if (relativeUrl === "./") {
    const pos = baseUrl.lastIndexOf("/")
    return baseUrl.substring(0, pos)
  }
  return baseUrl
}
