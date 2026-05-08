import { useAtomValue } from "jotai"
import { useEffect, useState } from "react"
import { settingsAtom } from "@/state/store"

/**
 * 检查当前域名是否在排除列表
 */
export function useExclusionCheck() {
  const settings = useAtomValue(settingsAtom)
  const [isExcluded, setIsExcluded] = useState(false)

  useEffect(() => {
    const currentDomain = window.location.hostname
    setIsExcluded(settings.excludedSites?.includes(currentDomain) ?? false)
  }, [settings.excludedSites])

  return isExcluded
}
