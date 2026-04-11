export class AsyncLock {
  private current: Promise<void> = Promise.resolve()

  async run<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void
    const next = new Promise<void>((resolve) => {
      release = resolve
    })
    const prev = this.current
    this.current = this.current.then(() => next)
    await prev
    try {
      return await fn()
    }
    finally {
      release!()
    }
  }
}
