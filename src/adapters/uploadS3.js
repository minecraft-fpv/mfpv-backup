// @flow

import path from "path"
import {formatISO} from "date-fns"
import type {MetaStream} from "./apexGet";
import StreamUploader from "../objects/StreamUploader";
import getS3Client from "../utils/getS3Client";
import prepareDeletion from "../utils/prepareDeletion";

export default async function uploadS3(
  ftpStream: MetaStream,
  remoteFolderName: string,
  remoteFileName: string,
  bucket: string
) {
  const client = getS3Client()

  const executeDeletion = await prepareDeletion(remoteFolderName)

  await upload(ftpStream, remoteFolderName, remoteFileName, bucket, client)

  await executeDeletion()
}

async function upload(
  ftpStream: MetaStream,
  remoteFolderName: string,
  remoteFileName: string,
  bucket: string,
  client
) {
  const totalBytes = ftpStream.sizeBytes
  console.log('Uploading', totalBytes / 1024 / 1024, 'MB')
  const key = `${remoteFolderName}/${path.basename(
    remoteFileName,
    path.extname(remoteFileName)
  )}_${formatISO(Date.now())}${path.extname(remoteFileName)}`
  console.log("Uploading", key)

  const size = 5 * 1024 * 1024
  await StreamUploader.uploadStream(client, ftpStream, size, bucket, key)

  console.log('resume')
}