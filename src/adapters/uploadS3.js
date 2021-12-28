// @flow

import {
  S3Client,
  ListObjectsCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3"
import path from "path"
import config from "../config"
import {differenceInCalendarDays, formatISO, isLastDayOfMonth, isToday, parseISO} from "date-fns"
import type {MetaStream} from "./apexGet";
import StreamUploader from "../objects/StreamUploader";

export default async function uploadS3(
  ftpStream: MetaStream,
  remoteFolderName: string,
  remoteFileName: string,
  bucket: string
) {
  const client = getClient()

  const items = await client.send(
    new ListObjectsCommand({
      Bucket: bucket,
      // ExpectedBucketOwner: (await client.config.credentials()).accessKeyId,
    })
  )
  console.log('items', items)
  const existingSnapshots = items.Contents?.filter((item) =>
    item.Key.startsWith(remoteFolderName)
  ) ?? []
  const deletions = existingSnapshots.filter((item) => {
    const date = item.LastModified
    const lastSeven = Math.abs(differenceInCalendarDays(Date.now(), date)) <= 7
    const lastDay = isLastDayOfMonth(date)
    const today = isToday(date)

    console.log('date', date)
    console.log('differenceInCalendarDays(Date.now(), date)', differenceInCalendarDays(Date.now(), date))
    console.log('lastSeven', lastSeven)
    console.log('lastDay', lastDay)
    console.log('isToday', today)

    const keep = !today && (lastSeven || lastDay)
    return !keep
  })
  console.log('deletions', deletions.map(_ => _.Key))

  await upload(ftpStream, remoteFolderName, remoteFileName, bucket, client)

  if (deletions.length) {
    console.log("deleting", deletions.map(({Key}) => Key))
    const deleteRes = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: deletions,
        },
      })
    )

    console.log("deleted", deleteRes?.Deleted?.map(_ => _.Key))
  }
}

function getClient() {
  // const provider = defaultProvider({
  //   profile: config.aws.profile,
  // })
  const client = new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey
    }
  })
  return client
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