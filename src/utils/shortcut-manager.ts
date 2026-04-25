import hotkeys from "hotkeys-js"

export class ShortcutManager {
  private static isMac(): boolean {
    return /Mac|iPhone|iPad|iPod/i.test(navigator?.platform ?? "")
  }

  private static getModifierKey(): string {
    return this.isMac() ? "command" : "ctrl"
  }

  private static getReaderShortcutKeys(): string[] {
    const modifier = this.getModifierKey()
    return ["right, space", "left", `${modifier}+right`, `${modifier}+left`, "esc"]
  }

  static bind(key: string, callback: (event: KeyboardEvent) => void) {
    hotkeys(key, (event: KeyboardEvent) => {
      event.preventDefault()
      callback(event)
    })
  }

  static unbind(key: string) {
    hotkeys.unbind(key)
  }

  /**
   * Set up default navigation shortcuts for the reader.
   */
  static setupReaderShortcuts(actions: {
    nextPage: () => void
    prevPage: () => void
    nextChapter: () => void
    prevChapter: () => void
    toggleReader: () => void
  }) {
    const [nextPage, prevPage, nextChapter, prevChapter, toggleReader] = this.getReaderShortcutKeys()
    this.bind(nextPage, actions.nextPage)
    this.bind(prevPage, actions.prevPage)
    this.bind(nextChapter, actions.nextChapter)
    this.bind(prevChapter, actions.prevChapter)
    this.bind(toggleReader, actions.toggleReader)
  }

  static unbindReaderShortcuts() {
    this.getReaderShortcutKeys().forEach(key => hotkeys.unbind(key))
  }
}
