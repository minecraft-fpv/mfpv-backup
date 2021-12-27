# mfpv-backup

This serverless project will download the world backup from the java server via FTP, and then it will save the snapshot in AWS S3.

It will store one snapshot per month.

## Manual AWS Setup
This project uses serverless to automate some AWS setup, but not all of it.

### 1. Create an EFS Access Point.
Set MFPV_AWS_EFS_FSAP_ARN equal to the access point ID.

Here are some example settings for the access point which have been tested to work:

* Root Directory Path: `/efs`
* POSIX User ID: `1001`
* POSIX Group ID: `1001`
* POSIX Secondary Group ID: `-`
* Root User ID: `1001`
* Root Group ID: `1001`
* Permissions: `755`

### 2. Create DataSync Task.
The way this project works is:

1. Connect to Java server using FTP and download the world to EFS.
3. Trigger the DataSync task to copy EFS to S3.
4. The lambda turns off.
5. The sync task will eventually run to completion.
6. The file will appear in the S3 bucket.

So you must create the DataSync task.

1. Source Location: The EFS file system you created previously.
2. Source Mount Path: Same as root directory path, `/efs`
3. Source Subnet and Security Group: Same as the EFS file system.
4. Destination should be your bucket.
5. Destination Pricing Tier: Do not use IA or Glacier. This project will upload **and delete** every day, thus incurring a pricing penalty when using Glacier. A derivation might disable deletion and only run once a month in order to be Glacier-suitable.


# TODO
## Glacier + Standard
One lambda runs daily so that players have access to the most current world state within a day.
Another lambda runs once a month and stores the object in Glacier for historical purposes.
