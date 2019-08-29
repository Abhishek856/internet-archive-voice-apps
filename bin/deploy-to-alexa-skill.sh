#!/usr/bin/env bash

set -e

# Version key/value should be on his own line
PACKAGE_VERSION=$(grep -m1 version ./functions/package.json | awk -F: '{ print $2 }' | sed 's/[", ]//g')

# TODO: NPM install without libs of Google Actions
# by using something like https://www.npmjs.com/package/install-subset

checkit='\xE2\x9C\x85'
echo -e "$checkit  deploy alexa skill"

rm -fdr ./deploy/alexa
mkdir -p ./deploy/alexa

cp -r ./functions/src ./deploy/alexa/
cp ./functions/index-alexa.js ./deploy/alexa/index-alexa.js
cp ./functions/package.json ./deploy/alexa/package.json
(cd ./deploy/alexa/; npm install --production)

# TODO show size of unzipped (it should be less then 250M)

# zip files
echo -e "$checkit  zip files"
FILE_NAME=skill-${PACKAGE_VERSION}.zip
(cd ./deploy/alexa/; zip --quiet -r ../${FILE_NAME} *)

# upload to s3
# FIXME: doesn't work yet
echo -e "$checkit  upload to S3"
aws --debug s3 cp "./deploy/alexa/${FILE_NAME}" s3://internet-archive-repo/

echo -e "$checkit  well done!"
