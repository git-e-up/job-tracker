#!/usr/bin/env bash
# Builds the app and deploys it to S3 + CloudFront.
# Usage: npm run deploy -- --stage prod   (stage defaults to prod)
set -euo pipefail

STAGE="prod"
if [[ "${1:-}" == "--stage" && -n "${2:-}" ]]; then
  STAGE="$2"
fi

cd "$(dirname "$0")/.."

echo "==> Building app (stage: $STAGE)"
npm run build

echo "==> Deploying S3/CloudFront infrastructure"
npx serverless deploy --stage "$STAGE"

STACK_NAME="job-tracker-frontend-$STAGE"
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
echo "Deployed: https://$DOMAIN"
echo "(A fresh distribution can take 10-15 minutes to fully propagate.)"
