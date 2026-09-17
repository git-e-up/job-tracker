import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

export const TABLE_NAME = "applications-local";

export function getClient() {
  const client = new DynamoDBClient({
    region: "local",
    endpoint: "http://localhost:8000",
    credentials: { accessKeyId: "local", secretAccessKey: "local" },
  });
  return DynamoDBDocumentClient.from(client);
}

// DynamoDB Local takes a moment to come up and serverless-dynamodb's
// `migrate` step creates the table shortly after that, so calls made right
// after the process starts need to tolerate both being briefly unavailable.
export async function retryUntilReady(fn, { attempts = 40, delayMs = 500 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr;
}
