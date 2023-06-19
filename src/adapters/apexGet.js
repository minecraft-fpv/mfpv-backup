// @flow

import fs from "fs-extra"
import path from "path"
import config from "../config"
import * as Stream from "stream"
import PartStream from "../objects/PartStream";
import delay from 'delay'
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

  const client = new FTP.Client(5000)
  client.ftp.verbose = true

  console.log('FTP config', {
    host,
    port,
    user: username,
    password,
    // secure: true,
  })

  await client.access({
    host,
    port,
    user: username,
    password,
    secure: false,
  })

  console.log("remotePath", remotePath)

  const sizeBytes = await client.size(remotePath)

  console.log('sizeBytes', sizeBytes)

  await delay(1000)

  const stream = new PartStream()

  // client.downloadTo(`./temp/Minecraft FPV.zip`, remotePath).then(res => {
  client.downloadTo(stream, remotePath).then(res => {
    console.log('res', res)
    client.close()
  }).catch(err => {
    console.log('FTP read stream error')
    console.error(err)
    client.close()
    stream.destroy()
  })

  return {
    partStream: stream,
    sizeBytes,
  }
}
