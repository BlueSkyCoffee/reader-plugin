const chineseNumberMap: Record<string, number> = {
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
  十: 10,
  十一: 11,
  十二: 12,
  十三: 13,
  十四: 14,
  十五: 15,
  十六: 16,
  十七: 17,
  十八: 18,
  十九: 19,
  二十: 20,
  二十一: 21,
  二十二: 22,
  二十三: 23,
  二十四: 24,
  二十五: 25,
  二十六: 26,
  二十七: 27,
  二十八: 28,
  二十九: 29,
  三十: 30,
}

export function getSeriesIndex(volumeName: string): number | null {
  return getSeriesIndexByLastNum(volumeName) ?? getSeriesIndexByVolumeName(volumeName)
}

function getSeriesIndexByLastNum(volumeName: string): number | null {
  const match = /.*\s(\d+(?:\.\d)?)$/.exec(volumeName)
  if (match && match[1]) {
    const num = Number.parseFloat(match[1])
    return Number.isNaN(num) ? null : num
  }
  return null
}

function getSeriesIndexByVolumeName(volumeName: string): number | null {
  const match = /第([一二三四五六七八九十]+)[卷话章]$/.exec(volumeName)
  if (match && match[1]) {
    return chineseNumberMap[match[1]] ?? null
  }
  return null
}
