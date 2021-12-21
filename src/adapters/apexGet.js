// @flow

import fs from "fs-extra"
import path from "path"
import config from "../config"
import * as Stream from "stream";
const FTP = require("ftp")

export type MetaStream = {
  stream: Stream.Readable,
  sizeBytes: number
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
  const basePath = path.resolve(
    config.isOffline ? "./temp" : config.aws.efs.mountPoint
  )
  // const fileLoc = path.resolve(`${basePath}/${remotePath}`)
  fs.ensureDirSync(basePath)
  fs.emptyDirSync(basePath)

  console.log(`Cleaned Folder: ${path.resolve(basePath)}`)
  console.log("Downloading World from Apex Hosting...")
  const promise = new Promise((resolve, reject) => {
    const ftp = new FTP()
    ftp.on("ready", () => {
      ftp.size(remotePath, (err, numBytes) => {
        if (err) {
          return reject(err)
        }

        ftp.get(remotePath, (err, stream) => {
          if (err) {
            return reject(err)
          }
          stream.once('close', () => {
            // console.log('closing stream')
            // console.log('ending ftp')
            ftp.end()
          });
          // stream.pipe(fs.createWriteStream(path.resolve(`${basePath}/${remotePath}`)));
          return resolve({
            stream: Stream.Readable.from(stream),
            sizeBytes: numBytes
          })
        })
      })
    })
    // ftp.on('end', () => {
    //   resolve()
    // })
    ftp.connect({
      host,
      user: username,
      password,
      port,
    })

    // const ftps = new FTPS({
    //     host,
    //     username,
    //     password,
    //     port,
    //     protocol: 'ftp'
    // })
    // ftps.get(remotePath, basePath)
    //     .exec((err, res) => {
    //     if (res.error) {
    //         console.error(res.error)
    //         return resolve(res.error)
    //     }
    //     console.log(res.data)
    //     resolve(res.data)
    // })

    // const command = `lftp -e "set ftp:ssl-allow no; get ${remotePath}; quit;" -u ${username},${password} ${host}:${port}`
    // console.log('command', command)
  })


  // Returns the stream:
  return await promise


  // const success = fs.pathExistsSync(fileLoc)
  // if (!success) {
  //   throw new Error("apexGet failed")
  // }
  //
  // console.log("Downloaded World.")
  // return fileLoc
}
