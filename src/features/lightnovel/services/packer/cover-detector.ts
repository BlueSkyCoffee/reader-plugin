export class UnsupportedImageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "UnsupportedImageError"
  }
}

export interface ImageInfo {
  width: number
  height: number
  mimeType: string
}

export class LightNovelCoverDetector {
  static coverRatio = 3 / 4

  private imageInfoMap = new Map<string, ImageInfo>()

  add(name: string, data: Uint8Array) {
    const info = getImageInfo(data)
    this.imageInfoMap.set(name, info)
  }

  detectCover(): string | null {
    if (this.imageInfoMap.size === 0) {
      return null
    }
    for (const [key, info] of this.imageInfoMap.entries()) {
      if (info.width / info.height < 1) {
        return key
      }
    }
    return this.imageInfoMap.keys().next().value ?? null
  }
}

export function getImageInfo(data: Uint8Array): ImageInfo {
  const reader = new ByteReader(data)
  const c1 = reader.readByte()
  const c2 = reader.readByte()
  const c3 = reader.readByte()

  // GIF
  if (c1 === 0x47 && c2 === 0x49 && c3 === 0x46) {
    reader.skip(3)
    const width = reader.readUint16(true)
    const height = reader.readUint16(true)
    return { width, height, mimeType: "image/gif" }
  }

  // JPG
  if (c1 === 0xFF && c2 === 0xD8) {
    let c3Local = reader.readByte()
    while (c3Local === 0xFF) {
      const marker = reader.readByte()
      const len = reader.readUint16(true)
      if (marker === 192 || marker === 193 || marker === 194) {
        reader.skip(1)
        const height = reader.readUint16(true)
        const width = reader.readUint16(true)
        return { width, height, mimeType: "image/jpeg" }
      }
      reader.skip(len - 2)
      c3Local = reader.readByte()
    }
  }

  // PNG
  if (c1 === 137 && c2 === 80 && c3 === 78) {
    reader.skip(15)
    const width = reader.readUint16(true)
    reader.skip(2)
    const height = reader.readUint16(true)
    return { width, height, mimeType: "image/png" }
  }

  // BMP
  if (c1 === 66 && c2 === 77) {
    reader.skip(15)
    const width = reader.readUint16(false)
    reader.skip(2)
    const height = reader.readUint16(false)
    return { width, height, mimeType: "image/bmp" }
  }

  // WEBP (match Dart logic)
  if (c1 === 0x52 && c2 === 0x49 && c3 === 0x46) {
    const bytes = reader.readBytes(27)
    if (bytes.length >= 27) {
      const width = ((bytes[24] & 0xFF) << 8) | (bytes[23] & 0xFF)
      const height = ((bytes[26] & 0xFF) << 8) | (bytes[25] & 0xFF)
      return { width, height, mimeType: "image/webp" }
    }
  }

  const head = `0x${c1.toString(16)} 0x${c2.toString(16)} 0x${c3.toString(16)}`
  throw new UnsupportedImageError(`不支持的图片类型(${head})`)
}

class ByteReader {
  private view: DataView
  private offset = 0

  constructor(buffer: Uint8Array) {
    this.view = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
  }

  readByte() {
    const value = this.view.getUint8(this.offset)
    this.offset += 1
    return value
  }

  readUint16(bigEndian: boolean) {
    const value = this.view.getUint16(this.offset, !bigEndian)
    this.offset += 2
    return value
  }

  skip(count: number) {
    this.offset += count
  }

  readBytes(count: number): Uint8Array {
    const start = this.offset
    const end = Math.min(this.offset + count, this.view.byteLength)
    this.offset = end
    return new Uint8Array(this.view.buffer.slice(this.view.byteOffset + start, this.view.byteOffset + end))
  }
}
