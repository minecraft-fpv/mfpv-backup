// @flow

import fs from "fs-extra"
import path from "path"
import config from "../config"
import * as Stream from "stream"
import PartStream from "../objects/PartStream";
const FTP = require("basic-ftp")

export type MetaStream = {
  partStream: PartStream,
  sizeBytes: number,
}

/*
Returns file system path of the downlaoded world file.
* */
export default async function apexGet(
  host: string,
  username: string,
  password: string,
  port: string,
  remotePath: string
): Promise<MetaStream> {
  console.log('config.java.remotePath', config.java.remotePath)
  // const basePath = path.resolve(
  //   config.isOffline ? "./temp" : config.aws.efs.mountPoint
  // )
  // const fileLoc = path.resolve(`${basePath}/Minecraft FPV.zip`)
  // fs.ensureDirSync(basePath)
  // fs.emptyDirSync(basePath)
  // console.log(`Cleaned Folder: ${path.resolve(basePath)}`)
  console.log("Downloading World from Apex Hosting...")

  const client = new FTP.Client()
  // client.ftp.verbose = true

  await client.access({
    host,
    port,
    user: username,
    password,
    secure: false,
  })

  const sizeBytes = await client.size(remotePath)

  console.log('sizeBytes', sizeBytes)

  const stream = new PartStream()

  // // $FlowFixMe
  // const originalWrite = stream._write
  // function newWrite(chunk, encoding, callback) {
  //   console.log('chunk', chunk.length)
  //   return originalWrite(chunk, encoding, callback)
  // }
  // // $FlowFixMe
  // stream._write = newWrite.bind(stream)

  client.downloadTo(stream, remotePath).then(res => {
    console.log('res', res)
    client.close()
  }).catch(err => {
    console.error(err)
    client.close()
    stream.destroy()
  })

  // await client.downloadTo(fileLoc, remotePath)
  // console.log(`Downloaded World to ${fileLoc}`)
  // client.close()
  // const stream = fs.createReadStream(fileLoc)
  // const stat = await (new Promise((resolve, reject) => {
  //   fs.stat(fileLoc, (err, stat) => {
  //     if (err) return reject(err)
  //     resolve(stat)
  //   })
  // }))

  // stream.on('data', (data) => {
  //   console.log('data', data?.length)
  // })

  return {
    partStream: stream,
    sizeBytes,
  }

  // Returns the stream:
  // return await promise
}
