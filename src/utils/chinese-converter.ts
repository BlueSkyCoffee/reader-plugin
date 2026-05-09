/**
 * 简繁转换工具
 * 使用 opencc-js 库实现
 */

import { Converter } from "opencc-js"

export type ChineseLocale = "cn" | "tw" | "hk" | "twp" | "jp"

// 转换器缓存
const converterCache: Map<string, Converter> = new Map()

/**
 * 获取或创建转换器
 */
function getConverter(from: ChineseLocale, to: ChineseLocale): Converter {
  // 相同语言不需要转换
  if (from === to) {
    return (text: string) => text
  }

  const key = `${from}->${to}`

  if (!converterCache.has(key)) {
    try {
      const converter = Converter({ from, to })
      converterCache.set(key, converter)
    }
    catch (error) {
      // 如果转换器创建失败，返回不转换的函数
      console.warn(`Failed to create converter: ${key}`, error)
      return (text: string) => text
    }
  }

  return converterCache.get(key)!
}

/**
 * 转换中文文本
 * @param text 要转换的文本
 * @param from 源语言：cn(简体), tw(繁体台湾), hk(繁体香港), twp(繁体台湾带短语), jp(日本汉字)
 * @param to 目标语言：cn, tw, hk, twp, jp
 * @returns 转换后的文本
 */
export function convertChinese(
  text: string,
  from: ChineseLocale,
  to: ChineseLocale,
): string {
  if (!text || from === to) {
    return text
  }

  try {
    const converter = getConverter(from, to)
    return converter(text)
  }
  catch (error) {
    console.warn("Chinese conversion failed:", error)
    return text
  }
}

/**
 * 批量转换对象中的所有字符串字段
 * 用于转换书籍详情
 */
export function convertObjectChinese<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  from: ChineseLocale,
  to: ChineseLocale,
): T {
  if (from === to || !obj) {
    return obj
  }

  const result = { ...obj }
  const converter = getConverter(from, to)

  for (const field of fields) {
    const value = result[field]
    if (typeof value === "string" && value) {
      try {
        result[field] = converter(value) as T[keyof T]
      }
      catch {
        // 保持原值
      }
    }
  }

  return result
}

/**
 * 检测文本是否为简体
 * 使用常见简体字特征判断
 */
export function isSimplifiedChinese(text: string): boolean {
  if (!text)
    return true

  // 简体特有字
  const simplifiedChars = ["的", "是", "不", "在", "人", "有", "这", "中", "大", "来", "上", "个", "国", "和", "地", "到", "以", "说", "时", "要", "就", "出", "会", "可", "也", "你", "对", "生", "能", "而", "子", "那", "得", "于", "着", "下", "自", "之", "年", "过", "发", "后", "作", "里", "用", "道", "行", "所", "然", "家", "种", "事", "成", "方", "多", "经", "么", "去", "学", "法", "如", "前", "都", "同", "心", "面", "问", "情", "很", "两", "国", "体", "制", "点"]

  // 繁体特有字
  const traditionalChars = ["的", "是", "不", "在", "人", "有", "這", "中", "大", "來", "上", "個", "國", "和", "地", "到", "以", "說", "時", "要", "就", "出", "會", "可", "也", "你", "對", "生", "能", "而", "子", "那", "得", "於", "著", "下", "自", "之", "年", "過", "發", "後", "作", "裡", "用", "道", "行", "所", "然", "家", "種", "事", "成", "方", "多", "經", "麼", "去", "學", "法", "如", "前", "都", "同", "心", "面", "問", "情", "很", "兩", "國", "體", "制", "點", "書", "時", "個", "國", "為", "於", "來", "會", "這", "說", "過", "學", "經", "問", "裡", "後", "發", "著", "能", "得", "種", "道", "對", "行", "面", "制", "點", "書"]

  let simplifiedCount = 0
  let traditionalCount = 0

  for (const char of text) {
    if (simplifiedChars.includes(char)) {
      simplifiedCount++
    }
    if (traditionalChars.includes(char) && !simplifiedChars.includes(char)) {
      traditionalCount++
    }
  }

  return simplifiedCount >= traditionalCount
}
