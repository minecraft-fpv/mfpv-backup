// @flow

require("dotenv-defaults/config")
const path = require('path')

const {
  MFPV_JAVA_SERVER_HOST,
  MFPV_JAVA_SERVER_PORT,
  MFPV_JAVA_SERVER_USERNAME,
  MFPV_JAVA_SERVER_PASSWORD,
  MFPV_JAVA_SERVER_ZIP_REMOTE_PATHNAME,
  MFPV_AWS_PROFILE,
  MFPV_AWS_REGION,
  MFPV_AWS_BUCKET,
  MFPV_AWS_EFS_FSAP_ARN,
  MFPV_AWS_EFS_MOUNT_POINT,
  MFPV_AWS_EFS_SUBNET_ID,
  MFPV_AWS_EFS_SECURITY_GROUP_ID,
  MFPV_AWS_ACCESS_KEY_ID,
  MFPV_AWS_SECRET_ACCESS_KEY,
  NODE_ENV,
} = process.env

// console.log("process.env", process.env)
console.log('NODE_ENV', NODE_ENV)

const config: {
  isOffline: boolean,
  java: {
    host: string,
    port: string,
    username: string,
    password: string,
    remotePath: string,
  },
  aws: {
    profile: string,
    region: string,
    bucket: string,
    efs: {
      fsAccessPointArn: string,
      mountPoint: string,
      subnetId: string,
      securityGroupId: string,
    },
    accessKeyId: string,
    secretAccessKey: string,
  },
} = {
  isOffline: NODE_ENV === 'local',
  java: {
    host: assertString(MFPV_JAVA_SERVER_HOST),
    port: assertString(MFPV_JAVA_SERVER_PORT),
    username: assertString(MFPV_JAVA_SERVER_USERNAME),
    password: assertString(MFPV_JAVA_SERVER_PASSWORD),
    remotePath: assertString(MFPV_JAVA_SERVER_ZIP_REMOTE_PATHNAME),
  },
  aws: {
    profile: assertString(MFPV_AWS_PROFILE),
    region: assertString(MFPV_AWS_REGION),
    bucket: assertString(MFPV_AWS_BUCKET),
    efs: {
      fsAccessPointArn: assertString(MFPV_AWS_EFS_FSAP_ARN),
      mountPoint: assertString(path.resolve(MFPV_AWS_EFS_MOUNT_POINT || '/')),
      subnetId: assertString(MFPV_AWS_EFS_SUBNET_ID),
      securityGroupId: assertString(MFPV_AWS_EFS_SECURITY_GROUP_ID)
    },
    accessKeyId: assertString(MFPV_AWS_ACCESS_KEY_ID),
    secretAccessKey: assertString(MFPV_AWS_SECRET_ACCESS_KEY)
  },
}

function assertString(value: any): string {
  return (value || '').toString()
}

export default config