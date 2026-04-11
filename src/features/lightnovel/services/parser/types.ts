import type { VolumeLink } from "@/types/novel"

export type { ChapterLink as Chapter, VolumeLink as Volume } from "@/types/novel"

export interface Novel {
  id: string
  title: string
  author: string
  cover?: string
  catalogUrl?: string
  volumes: VolumeLink[]
  source: "bili" | "wenku"
}
