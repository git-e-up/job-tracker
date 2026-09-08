#!/usr/bin/env bash
# Builds the read-only demo (using .env.demo) and syncs it to the same
# S3/CloudFront hosting stack that scripts/deploy.sh provisions — this
# script only rebuilds and re-syncs, it doesn't touch the infra itself.
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building demo app"
npx tsc -b
npx vite build --mode demo

STACK_NAME="job-tracker-frontend-prod"
BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='BucketName'].OutputValue" --output text)
DISTRIBUTION_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionId'].OutputValue" --output text)
DOMAIN=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" \
  --query "Stacks[0].Outputs[?OutputKey=='DistributionDomain'].OutputValue" --output text)

echo "==> Syncing dist/ to s3://$BUCKET"
aws s3 sync dist/ "s3://$BUCKET" --delete

echo "==> Invalidating CloudFront cache ($DISTRIBUTION_ID)"
aws cloudfront create-invalidation --distribution-id "$DISTRIBUTION_ID" --paths "/*" > /dev/null

echo ""
echo "Deployed demo: https://$DOMAIN"
