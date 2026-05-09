/**
 * 计算两个字符串的相似度 (0-1)
 * 使用 Dice Coefficient 算法
 */
export function stringSimilarity(str1: string, str2: string): number {
  if (str1 === str2)
    return 1
  if (str1.length < 2 || str2.length < 2)
    return 0

  const bigrams1 = getBigrams(str1)
  const bigrams2 = getBigrams(str2)

  const set2 = new Set(bigrams2)
  let intersectionSize = 0

  for (const bigram of bigrams1) {
    if (set2.has(bigram)) {
      intersectionSize++
      set2.delete(bigram) // 避免重复计数
    }
  }

  return (2 * intersectionSize) / (bigrams1.length + bigrams2.length)
}

function getBigrams(str: string): string[] {
  const bigrams: string[] = []
  for (let i = 0; i < str.length - 1; i++) {
    bigrams.push(str.substring(i, i + 2))
  }
  return bigrams
}

/**
 * 对搜索结果按相似度排序
 * @param query 搜索关键词
 * @param results 搜索结果数组
 * @param getBookName 获取书名的函数
 * @param getAuthor 获取作者的函数
 */
export function sortSearchResults<T>(
  query: string,
  results: T[],
  getBookName: (item: T) => string,
  getAuthor?: (item: T) => string,
): T[] {
  if (results.length === 0)
    return results

  const queryLower = query.toLowerCase()

  // 计算每个结果的相似度得分
  const scored = results.map((item) => {
    const bookName = getBookName(item).toLowerCase()
    const author = getAuthor?.(item)?.toLowerCase() || ""

    // 书名相似度权重更高
    const nameSimilarity = stringSimilarity(queryLower, bookName)

    // 精确匹配加分
    const exactMatchBonus = bookName.includes(queryLower) || queryLower.includes(bookName)
      ? 0.5
      : 0

    // 作者相似度（权重较低）
    const authorSimilarity = author
      ? stringSimilarity(queryLower, author) * 0.3
      : 0

    const score = nameSimilarity + exactMatchBonus + authorSimilarity

    return { item, score }
  })

  // 按得分降序排序
  scored.sort((a, b) => b.score - a.score)

  return scored.map(s => s.item)
}
