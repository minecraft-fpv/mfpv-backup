// @flow

const {Writable} = require('stream')

const PART_SIZE = 5 * 1024 * 1024

export default class PartStream extends Writable {
  consumer: (part: Buffer, partNumber: number) => Promise<any>
  onComplete: () => Promise<any>
  buffer: Buffer

  pendingParts: Array<Buffer> = []
  partNumber: number = 1

  // readActive: boolean = false
  writingDone: boolean = false

  stop: boolean = false

  constructor(options: any) {
    super(options);
    this.buffer = Buffer.from([])
    process.on('SIGINT', () => {
      this.stop = true
    })
  }

  startReading(consumer: (part: Buffer, partNumber: number) => Promise<any>, onComplete: () => Promise<any>): Promise<any> {
    this.consumer = consumer
    this.onComplete = onComplete
    console.log('startReading')
    return this.loop()
  }

  async loop() {
    while(!this.writingDone || !!this.pendingParts.length) { // todo: this assumes writing finishes before uploading.
      console.log('loop')
      await delay(250)

      if (this.stop) {
        break
      }

      // get part
      const part = this.pendingParts.shift()

      if (!part || !part.length) continue

      console.log('read part.length', part.length)
      if (part.length < PART_SIZE) {
        console.log('********************************************************* ********************************************************* ********************************************************* ********************************************************* ********************************************************* *********************************************************')
      }

      // Issue partNumber:
      const frozenPartNumber = this.partNumber
      this.partNumber++

      // send part
      await this.consumer(part, frozenPartNumber)
    }
    console.log('loop done')
    await this.onComplete()
  }

  pushPendingPart(value: Buffer) {
    this.pendingParts.push(value)
  }

  _write(chunk: any, encoding: any, callback: any) {
    if (this.stop) {
      callback()
      return
    }

    // push new data onto a buffer
    // cut off parts from the front of the buffer when possible.

    if (Buffer.isBuffer(chunk)) {
      this.buffer = Buffer.concat([this.buffer, chunk], this.buffer.length + chunk.length)
      if (this.buffer.length >= PART_SIZE) {
        const part = this.buffer.slice(0, PART_SIZE)
        this.buffer = this.buffer.slice(PART_SIZE)
        console.log('write part.length', part.length)
        this.pushPendingPart(part)
      }
    }
    callback()
  }

  // $FlowFixMe
  end() {
    super.end()
    this.writingDone = true
    const part = this.buffer
    this.buffer = Buffer.from([])
    this.pushPendingPart(part) // flush buffer
  }

  // setReadActive(value: boolean): void {
  //   // console.log('setReadActive', value)
  //   this.readActive = value
  //
  //   if (value) {
  //     const data = this.buffer
  //     this.buffer = Buffer.from([])
  //     this.myPush(data)
  //   }
  // }
  //
  // myPush(value: Buffer) {
  //   // console.log('myPush', value.length)
  //   if (!this.push(value)) {
  //     this.setReadActive(false)
  //   }
  //   if (this.writingDone && this.buffer.length === 0) {
  //     this.emit('close')
  //   }
  // }

  // _write(chunk: any, encoding: any, callback: any) {
  //   // console.log('_write', chunk.length)
  //   if (Buffer.isBuffer(chunk)) {
  //     if (this.readActive) {
  //       // Push new data through.
  //       // Buffer was cleared when readActive was set to true
  //       this.myPush(chunk)
  //     } else {
  //       this.buffer = Buffer.concat([this.buffer, chunk], this.buffer.length + chunk.length)
  //     }
  //   }
  //   callback()
  // }

  // _read(size: number) {
  //   this.setReadActive(true)
  // }
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve()
    }, ms)
  })
}