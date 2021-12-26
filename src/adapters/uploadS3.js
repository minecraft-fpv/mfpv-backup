// @flow

import {
  S3Client,
  ListObjectsCommand,
  DeleteObjectsCommand,
} from "@aws-sdk/client-s3"
import path from "path"
import config from "../config"
import { formatISO, isThisMonth } from "date-fns"
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
  const snapshotsInThisMonth = existingSnapshots.filter((item) =>
    isThisMonth(item.LastModified)
  )
  console.log("snapshotsInThisMonth", snapshotsInThisMonth.map(_ => _.Key))

  await upload(ftpStream, remoteFolderName, remoteFileName, bucket, client)

  if (snapshotsInThisMonth.length) {
    // Delete comes after Put on purpose.
    // We don't want to be in any intermediate state where there are no
    // snapshots in the cloud because of small risk of fluke failure
    // which leave the cloud state without any snapshots.
    console.log("deleting", snapshotsInThisMonth.map(({Key}) => Key))
    const deleteRes = await client.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: {
          Objects: snapshotsInThisMonth,
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