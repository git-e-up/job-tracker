import { APIGatewayProxyHandler } from "aws-lambda";
import { PutCommand, ScanCommand, UpdateCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuid } from "uuid";
import { ddb, TABLE_NAME } from "../lib/dynamodb";

const headers = { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" };

export const create: APIGatewayProxyHandler = async (event) => {
  const body = JSON.parse(event.body ?? "{}");
  const now = new Date().toISOString();

  const item = {
    id: uuid(),
    company: body.company,
    role: body.role,
    status: body.status ?? "applied",
    dateApplied: body.dateApplied ?? now,
    lastUpdated: now,
    url: body.url ?? "",
    notes: body.notes ?? "",
    activity: body.activity ?? "Applied online",
    employerAddress: body.employerAddress ?? "",
    employerCityStateZip: body.employerCityStateZip ?? "",
    employerPhone: body.employerPhone ?? "",
    contactMethod: body.contactMethod ?? "none",
    contactValue: body.contactValue ?? "",
    personContacted: body.personContacted ?? "",
  };

  await ddb.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

  return { statusCode: 201, headers, body: JSON.stringify(item) };
};

export const list: APIGatewayProxyHandler = async () => {
  const result = await ddb.send(new ScanCommand({ TableName: TABLE_NAME }));
  return { statusCode: 200, headers, body: JSON.stringify(result.Items ?? []) };
};

export const update: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.id;
  const body = JSON.parse(event.body ?? "{}");

  const allowed = [
    "company",
    "role",
    "status",
    "url",
    "notes",
    "dateApplied",
    "activity",
    "employerAddress",
    "employerCityStateZip",
    "employerPhone",
    "contactMethod",
    "contactValue",
    "personContacted",
  ] as const;
  const updates = allowed.filter((key) => body[key] !== undefined);

  if (!id || updates.length === 0) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "Nothing to update" }) };
  }

  const expressionNames: Record<string, string> = { "#lastUpdated": "lastUpdated" };
  const expressionValues: Record<string, unknown> = { ":lastUpdated": new Date().toISOString() };
  const setClauses = ["#lastUpdated = :lastUpdated"];

  updates.forEach((key, i) => {
    const nameKey = `#f${i}`;
    const valueKey = `:v${i}`;
    expressionNames[nameKey] = key;
    expressionValues[valueKey] = body[key];
    setClauses.push(`${nameKey} = ${valueKey}`);
  });

  const result = await ddb.send(
    new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: `SET ${setClauses.join(", ")}`,
      ExpressionAttributeNames: expressionNames,
      ExpressionAttributeValues: expressionValues,
      ReturnValues: "ALL_NEW",
    })
  );

  return { statusCode: 200, headers, body: JSON.stringify(result.Attributes) };
};

export const remove: APIGatewayProxyHandler = async (event) => {
  const id = event.pathParameters?.id;
  if (!id) {
    return { statusCode: 400, headers, body: JSON.stringify({ message: "Missing id" }) };
  }

  await ddb.send(new DeleteCommand({ TableName: TABLE_NAME, Key: { id } }));
  return { statusCode: 204, headers, body: "" };
};
