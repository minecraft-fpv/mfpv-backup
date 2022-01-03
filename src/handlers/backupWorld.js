// @flow

import axios from "axios";
import apexGet from "../adapters/apexGet";
import config from "../config";
import uploadS3 from "../adapters/uploadS3";
import fs from 'fs'

exports.handler = async function(event: any): any {
  console.log('Starting Backup')
  let stream
  try {
    const panda = await axios.get('https://some-random-api.ml/animal/panda')
    console.log('panda.data', panda.data)

    const startTime = Date.now()
    stream = await apexGet(
      config.java.host,
      config.java.username,
      config.java.password,
      config.java.port,
      config.java.remotePath
    )
    // const stream = fs.createReadStream('./temp/test.mov')

    // await uploadS3(
    //   stream,
    //   'snapshots',
    //   config.java.remotePath,
    //   config.aws.bucket
    // )

    return {
      "statusCode": 200,
      "headers": {
        "Content-Type": "application/json"
      },
      "isBase64Encoded": false,
      "multiValueHeaders": {
        // "X-Custom-Header": ["My value", "My other value"],
      },
      "body": JSON.stringify({message: "Backup Complete"})
    }
  } catch (err) {
    console.error(err)
    if (stream) {
      stream.partStream.destroy()
    }
    return {
      "statusCode": 400,
      "headers": {
        "Content-Type": "application/json"
      },
      "isBase64Encoded": false,
      "multiValueHeaders": {
        // "X-Custom-Header": ["My value", "My other value"],
      },
      "body": JSON.stringify({message: "Backup Failed"})
    }
  }
}
