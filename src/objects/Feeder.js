// // @flow
//
// export default class Feeder<T> {
//   consumer: (part: T) => Promise<any>
//   pendingParts: Array<T> = []
//
//   promise: Promise<any>
//   _resolve: any
//   _reject: any
//
//   feedingStarted: boolean
//   stop: boolean = false
//
//   constructor(consumer: (part: T) => Promise<any>) {
//     this.consumer = consumer
//     this.promise = new Promise((resolve, reject) => {
//       this._resolve = (value) => {
//         this.stop = true
//         resolve(value)
//       }
//       this._reject = (value) => {
//         this.stop = true
//         reject(value)
//       }
//
//       process.on('SIGINT', () => {
//         this.stop = true
//       })
//     })
//   }
//
//   push(value: T) {
//     this.pendingParts.push(value)
//     this.startFeeding()
//   }
//
//   startFeeding() {
//     if (!this.feedingStarted) {
//       this.feedingStarted = true
//       this.feed()
//     }
//   }
//
//   feed() {
//     const part = this.pendingParts.shift()
//     console.log('part', part?.length)
//     if (!part || this.stop) {
//       // Nothing left to upload
//       this._resolve()
//       return
//     }
//     this.consumer(part).then(res => {
//       // After uploading a part, try to upload the next one:
//       this.feed()
//     }).catch(err => {
//       console.error(err)
//       this._reject(err)
//     })
//   }
// }