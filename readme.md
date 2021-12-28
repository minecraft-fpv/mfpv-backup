# mfpv-backup

This serverless project will download the world backup from the java server via FTP, and then it will save the snapshot in AWS S3.

Deploy it using `npm run deploy-dev`.

Once deployed, on a cron timer, it will:

1. Connect to Java server using FTP and download the world.
2. Upload the file to S3.
3. Deletes all files from S3 except:
  * Keep 1 file per day from the last 7 days.
  * Keep 1 file per last day of the month.

This will delete files depending on the `.env` variables you set, so please be careful with your settings.

* The `MFPV_AWS_BUCKET` variable is the bucket it will be deleting from.
* It will delete objects with a `Key` starting with `/snapshots`.
