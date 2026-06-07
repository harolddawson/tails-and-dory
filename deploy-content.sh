#!/bin/bash
set -e

BUCKET="tailsanddorystack-sitebucket397a1860-4rcvpebwsizk"
DIST_ID="E3H8PEK308HV2"

aws s3 sync "$(dirname "$0")/src/" "s3://$BUCKET/" \
  --exclude ".idea/*" \
  --exclude "README.md" \
  --exclude ".DS_Store" \
  --delete

aws cloudfront create-invalidation --distribution-id "$DIST_ID" --paths "/*"
