import { httpGetString } from "../http-util"

const codeLowerA = "a".charCodeAt(0)
const codeLowerZ = "z".charCodeAt(0)
const codeUpperA = "A".charCodeAt(0)
const codeUpperZ = "Z".charCodeAt(0)

export class BiliNovelHelper {
  static async getSecretMap(): Promise<Record<string, string>> {
    const url = "https://www.bilinovel.com/themes/zhmb/js/readtools.js"
    const js = await httpGetString(url, { credentials: "include" })
    const data = this.extractData(js)
    const decryptJsCode = this.decrypt(data)
    return this.toMap(decryptJsCode)
  }

  private static extractData(js: string): string {
    const before = "['\\x61\\x70\\x70\\x6c\\x79'](null,\""
    const after = "\"['\\x73\\x70\\x6c\\x69\\x74']"
    const start = js.indexOf(before)
    const end = js.lastIndexOf(after)
    if (start < 0 || end < 0 || end <= start) {
      return ""
    }
    return js.substring(start + before.length, end)
  }

  private static decrypt(data: string): string {
    let decryptData = ""
    let code = ""
    for (let i = 0; i < data.length; i++) {
      const charCode = data.charCodeAt(i)
      const isAlpha
        = (charCode >= codeUpperA && charCode <= codeUpperZ)
          || (charCode >= codeLowerA && charCode <= codeLowerZ)
      if (isAlpha) {
        if (code.length > 0) {
          decryptData += String.fromCharCode(Number.parseInt(code, 10))
        }
        code = ""
      }
      else {
        code += data[i]
      }
    }
    return decryptData
  }

  private static toMap(jsCode: string): Record<string, string> {
    const map: Record<string, string> = {}
    const normalized = jsCode.replaceAll("\\'", "\"").replaceAll("'", "\"")
    const splits = normalized.split(".replace")
    const prefix = "RegExp(\""
    const suffix1 = "), \""
    const suffix2 = "),\""
    splits.forEach((split) => {
      let start = split.indexOf(prefix)
      if (start === -1) {
        return
      }
      const key = split.substring(start + prefix.length, start + prefix.length + 1)
      let suffix = suffix1
      start = split.indexOf(suffix)
      if (start === -1) {
        suffix = suffix2
        start = split.indexOf(suffix)
      }
      if (start === -1) {
        return
      }
      const value = split.substring(start + suffix.length, start + suffix.length + 1)
      map[key] = value
    })
    return map
  }
}
