// @flow

import Stream from "stream";
import {
  CompleteMultipartUploadCommand,
  CreateMultipartUploadCommand,
  S3Client,
  UploadPartCommand
} from "@aws-sdk/client-s3";
import type {MetaStream} from "../adapters/apexGet";
import ProgressBar from "progress";
import Feeder from "./Feeder";

export default class StreamUploader {
  // constants:
  client: any
  metaStream: MetaStream
  partSizeBytes: number
  bucket: string
  key: string

  /*
  Resolves if upload completed.
  Rejects with error message if upload fails.
  * */
  promise: Promise<any>
  _resolve: any
  _reject: any

  bar: any
  maxParts: number

  // variables:
  buffer: Buffer
  uploadId: string
  partNumber: number = 1
  pendingParts: Feeder<Buffer>
  completedParts: Array<any> = []
  processedBytes: number = 0

  constructor(client: any, metaStream: MetaStream, partSizeBytes: number, bucket: string, key: string) {
    this.client = client
    this.metaStream = metaStream
    this.partSizeBytes = partSizeBytes
    this.buffer = Buffer.from([])
    this.bucket = bucket
    this.key = key

    this.promise = new Promise((resolve, reject) => {
      this._resolve = resolve
      this._reject = reject

      process.on('SIGTERM', () => {
        reject()
      })
    })

    this.pendingParts = new Feeder((part) => {
      return this.uploadPart(part).catch(err => {
        this.handleError(err)
      })
    })

    const maxParts = Math.ceil(metaStream.sizeBytes / partSizeBytes)
    this.bar = new ProgressBar('Uploading :current/:total [:bar] :percent :etas remaining', {
      complete: '=',
      incomplete: ' ',
      width: 20,
      total: maxParts
    });
    this.maxParts = maxParts

    this.startUploading().catch(err => {
      this.handleError(err)
    })
  }

  static uploadStream(client: any, metaStream: MetaStream, partSizeBytes: number, bucket: string, key: string): Promise<any> {
    const uploader = new StreamUploader(client, metaStream, partSizeBytes, bucket, key)
    return uploader.promise
  }

  async startUploading() {
    const res = await this.client.send(
      new CreateMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.key,

        // Files will be private.
        // We will use discord bot to generate signed URL so that we can monitor and limit download abuse.
        // Our abuse deterrent will be to simply make signed URL requests publicly visible to other discord members.
        ACL: "private",
      })
    )
    this.uploadId = res.UploadId

    console.log('here')
    // this.metaStream.stream.resume()
    this.metaStream.stream.on('data', (data) => {
      if (!data) return

      this.processedBytes += data.length

      // Add data to the buffer as it comes in.
      const totalLength = this.buffer.length + data.length
      this.buffer = Buffer.concat([this.buffer, data], totalLength)

      // console.log('buffer.length', this.buffer.length)

      // console.log('this.buffer.length', this.buffer.length)

      // If the buffer grows beyond the threshold, cut it off and queue the part to be uploaded.
      if (this.buffer.length >= this.partSizeBytes) {
        const data = this.buffer.slice(0, this.partSizeBytes)
        this.buffer = this.buffer.slice(this.partSizeBytes)
        // console.log('chopped data.length', data.length)
        // console.log('this.buffer.length', this.buffer.length)
        this.pendingParts.push(data)
      }
    })

    this.metaStream.stream.once('close', async () => {
      // When the stream closes, the buffer should contain the remaining data which hasn't been uploaded yet.
      this.pendingParts.push(this.buffer)
      await this.pendingParts.promise

      // End
      this.finishUpload().catch(err => {
        this.handleError(err)
      })
    })
  }

  async uploadPart(data: Buffer, options?: {
    closing?: boolean
  }) {
    // this.partNumber will change during async yields.
    const myPartNumber = this.partNumber
    this.partNumber++
    // this.bar.tick(1)
    console.log(`Uploading part ${myPartNumber}/${this.maxParts}`)

    // console.log('data', data?.length)
    const uploadRes = await this.client.send(
      new UploadPartCommand({
        Bucket: this.bucket,
        Body: data,
        Key: this.key,
        PartNumber: myPartNumber,
        UploadId: this.uploadId,
      })
    )
    const completedPart = {
      ETag: uploadRes.ETag,
      PartNumber: myPartNumber,
    }
    this.completedParts.push(completedPart)
    console.log('this.completedParts.length', this.completedParts.length)
  }

  async finishUpload() {
    console.log("completing upload")
    console.log('this.completedParts.length', this.completedParts.length)
    const res = await this.client.send(
      new CompleteMultipartUploadCommand({
        Bucket: this.bucket,
        Key: this.key,
        UploadId: this.uploadId,
        MultipartUpload: {
          Parts: this.completedParts,
        },
      })
    )

    console.log("completed", this.key)

    this.metaStream.stream.destroy()
    this._resolve()
  }

  handleError(error: any) {
    console.error(error)
    this.metaStream.stream.destroy()
    this._reject()
  }
}