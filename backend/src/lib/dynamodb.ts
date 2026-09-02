import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const isLocal = process.env.IS_OFFLINE === "true";

const client = new DynamoDBClient(
  isLocal
    ? {
        region: "local",
        endpoint: "http://localhost:8000",
        credentials: { accessKeyId: "local", secretAccessKey: "local" },
      }
    : {}
);

export const ddb = DynamoDBDocumentClient.from(client);

export const TABLE_NAME = process.env.APPLICATIONS_TABLE ?? "applications-local";
