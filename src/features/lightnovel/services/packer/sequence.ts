export class Sequence {
  private start: number
  private step: number
  private nowVal: number

  constructor(start = 1, step = 1) {
    this.start = start
    this.step = step
    this.nowVal = start - step
  }

  get next() {
    this.nowVal += this.step
    return this.nowVal
  }

  reset() {
    this.nowVal = this.start - this.step
  }
}
