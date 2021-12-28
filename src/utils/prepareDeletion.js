// @flow

import getS3Client from "./getS3Client";
import {DeleteObjectsCommand, ListObjectsCommand} from "@aws-sdk/client-s3";
import config from "../config";
import {differenceInCalendarDays, isLastDayOfMonth, isToday} from "date-fns";

/**
 * Deletes files from a folder of your choice so that these rules upheld:
 *  * Keep 1 file per day from the last 7 days.
 *  * Keep 1 file per last day of the month.
 *  * Keep at most 1 file per day a file should be held.
 *
 * Usage:
 * ```
 * const executeDeletion = await prepareDeletion('snapshots')
 * await uploadNewFiles()
 * await executeDeletion()
 * ```
 * In plain english:
 * You should prepare the deletion before uploading new files,
 * and then execution of the deletion should come after that.
 *
 * @param folderPrefix Example: If Key is 'snapshot/Minecraft FPV.zip'
 * */
export default async function prepareDeletion(folderPrefix: string): Promise<() => Promise<void>> {
  console.log('deleteFilesFromS3')
  const client = getS3Client()

  const items = await client.send(
    new ListObjectsCommand({
      Bucket: config.aws.bucket,
      // ExpectedBucketOwner: (await client.config.credentials()).accessKeyId,
    })
  )
  console.log('items', items)

  const inTheFolder = items.Contents?.filter((item) =>
    item.Key.startsWith(folderPrefix)
  ) ?? []

  console.log('inTheFolder', inTheFolder.map(item => item.Key))

  const deletions = inTheFolder.filter((item) => {
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

  const executeDeletion = async () => {
    if (deletions.length) {
      console.log("deleting", deletions.map(({Key}) => Key))
      const deleteRes = await client.send(
        new DeleteObjectsCommand({
          Bucket: config.aws.bucket,
          Delete: {
            Objects: deletions,
          },
        })
      )

      console.log("deleted", deleteRes?.Deleted?.map(_ => _.Key))
    }
  }

  return executeDeletion
}