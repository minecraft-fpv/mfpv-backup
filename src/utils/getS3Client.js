// @flow

import {S3Client} from "@aws-sdk/client-s3";
import config from "../config";

export default function getS3Client(): any {
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