// @flow
import {
  PutObjectCommand
} from "@aws-sdk/client-s3";
const mysqlBackup = require('mysql-backup')
import config from "../config";
import {formatISO} from "date-fns";
import getS3Client from "../utils/getS3Client";
import prepareDeletion from "../utils/prepareDeletion";

const S3_FOLDER = 'db-restore-scripts'

type Options = {
  unscheduled?: ?boolean // Used by asyncRestore.js
}

exports.handler = async function(event: {body: Options}): any {
  console.log('Starting DB Backup.')

  const dump = await mysqlBackup({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.pass,
    database: config.db.database,
    tables: [], // only these tables
    schema: true,
    data: true,
    // where: {'players': 'id < 1000'}, // Only test players with id < 1000
    ifNotExist: false,
    dropTable: true,
    // getDump: false,
    // socketPath:
  })

  console.log('dump', dump)

  const client = getS3Client()

  const executeDeletion = await prepareDeletion(S3_FOLDER)
  await upload(client, dump, event.body)
  await executeDeletion()
}

async function upload(client, dump, options?: ?Options) {
  const key = `${options?.unscheduled ? 'unscheduled-' : ''}${S3_FOLDER}/mfpv_${formatISO(Date.now())}.sql`

  const uploadRes = await client.send(
    new PutObjectCommand({
      Bucket: config.aws.bucket,
      Body: Buffer.from(dump, 'utf-8'),
      Key: key
    })
  )
  console.log('uploadRes', uploadRes)
}

// exports.handler = async function(event: any): any {
//   const connection = mysql.createConnection({
//     host: config.db.host,
//     port: config.db.port,
//     user: config.db.user,
//     password: config.db.pass,
//     database: config.db.schema
//   })
//
//   const query = makeQuery(connection)
//
//   const res = await query(sqltag`
//     select * from RaceTrack order by dateUpdated desc;
//   `)
//
//   console.log('res', res)
// }

// function makeQuery(connection) {
//   return async (sql) => {
//
//     if (typeof sql !== 'string') {
//       sql = flattenSqlTag(sql)
//     }
//
//     return new Promise((resolve, reject) => {
//       connection.query(sql, (err, results, fields) => {
//         console.log('sql', sql)
//         if (err) {
//           return reject(err)
//         }
//         return resolve(results)
//       })
//     })
//   }
// }
//
// function flattenSqlTag(sql: any): string {
//   sql = mysql.format(sql.sql, sql.values)
//   return sql
// }
