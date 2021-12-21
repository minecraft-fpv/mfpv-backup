// @flow

import serverless from "serverless-http"
import express from "express"
import apexGet from "./adapters/apexGet";
import config from "./config";
import uploadS3 from "./adapters/uploadS3";
import fs from 'fs'

const app = express();

app.use(express.json({
  verify: (req, res, buf) => {
    req.rawBody = buf
  }
}))

// root routes seem to be bugged.
// http://localhost:4000/dev doesn't work
// http://localhost:4000/dev/ doesn't work
// but http://localhost:4000/dev// does.
// This might be fixed by: https://github.com/firebase/firebase-functions/issues/27#issuecomment-292768599
app.get("/", (req, res) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/aaa", (req, res) => {
  return res.status(200).json({
    message: "Hello from aaa!",
  });
});

app.get('/backup', async (req, res) => {
  try {
    const startTime = Date.now()
    const stream = await apexGet(
        config.java.host,
        config.java.username,
        config.java.password,
        config.java.port,
        config.java.remotePath
    )
    // const stream = fs.createReadStream('./temp/test.mov')
    await uploadS3(
      // {
      //   stream,
      //   sizeBytes: 8.5 * 1024 * 1024
      // },
      stream,
      // fileLoc,
      // './temp/simpnation.zip',
      'snapshots',
      'Minecraft_FPV.zip',
      config.aws.bucket
    )
    const elapsed = Date.now() - startTime
    res.status(200).send(`${elapsed / 1000} seconds`)
  } catch (err) {
    console.error(err)
    res.sendStatus(400)
  }
})

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

// $FlowFixMe
exports.handler = serverless(app);
