// @flow

export default function(statusCode: number, payload: any): any {
  return {
    "statusCode": statusCode,
    "headers": {
      "Content-Type": "application/json"
    },
    "isBase64Encoded": false,
    "multiValueHeaders": {
      // "X-Custom-Header": ["My value", "My other value"],
    },
    "body": JSON.stringify(payload)
  }
}