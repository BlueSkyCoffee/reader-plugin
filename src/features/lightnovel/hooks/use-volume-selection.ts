/**
 * 卷选择 Hook
 */

import { useCallback, useState } from "react"

export function useVolumeSelection(totalVolumes: number) {
  const [selectedVolumes, setSelectedVolumes] = useState<Set<number>>(() => new Set())
  const [startChapter, setStartChapter] = useState(1)
  const [endChapter, setEndChapter] = useState(1)

  const toggleVolume = useCallback((volumeIdx: number) => {
    setSelectedVolumes((prev) => {
      const next = new Set(prev)
      if (next.has(volumeIdx)) {
        next.delete(volumeIdx)
      }
      else {
        next.add(volumeIdx)
      }
      return next
    })
  }, [])

  const selectAllVolumes = useCallback(() => {
    const all = new Set<number>()
    for (let i = 0; i < totalVolumes; i++) {
      all.add(i)
    }
    setSelectedVolumes(all)
  }, [totalVolumes])

  const clearSelection = useCallback(() => {
    setSelectedVolumes(new Set())
  }, [])

  const isVolumeSelected = useCallback(
    (volumeIdx: number) => selectedVolumes.has(volumeIdx),
    [selectedVolumes],
  )

  return {
    selectedVolumes,
    startChapter,
    setStartChapter,
    endChapter,
    setEndChapter,
    toggleVolume,
    selectAllVolumes,
    clearSelection,
    isVolumeSelected,
  }
}
