import type { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from "aws-lambda";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { create, list, update, remove } from "./applications";

const send = vi.fn();

// vi.mock calls are hoisted above imports by Vitest, so the static import of
// "./applications" above resolves against this mocked "../lib/dynamodb".
vi.mock("../lib/dynamodb", () => ({
  ddb: { send: (...args: unknown[]) => send(...args) },
  TABLE_NAME: "applications-test",
}));

function invoke(handler: APIGatewayProxyHandler, event: Partial<APIGatewayProxyEvent>): Promise<APIGatewayProxyResult> {
  return Promise.resolve(
    handler(event as APIGatewayProxyEvent, {} as never, (() => {}) as never)
  ) as Promise<APIGatewayProxyResult>;
}

beforeEach(() => {
  send.mockReset();
});

describe("create", () => {
  it("stores an item with defaults applied and returns 201", async () => {
    send.mockResolvedValue({});
    const res = await invoke(create, {
      body: JSON.stringify({ company: "Zeiss", role: "Frontend Engineer" }),
    });

    expect(res.statusCode).toBe(201);
    const item = JSON.parse(res.body);
    expect(item.company).toBe("Zeiss");
    expect(item.role).toBe("Frontend Engineer");
    expect(item.status).toBe("applied");
    expect(item.activity).toBe("Applied online");
    expect(item.contactMethod).toBe("none");
    expect(typeof item.id).toBe("string");
    expect(item.id.length).toBeGreaterThan(0);

    expect(send).toHaveBeenCalledTimes(1);
    const command = send.mock.calls[0][0];
    expect(command.input.TableName).toBe("applications-test");
    expect(command.input.Item.company).toBe("Zeiss");
  });

  it("respects explicitly provided fields instead of defaults", async () => {
    send.mockResolvedValue({});
    const res = await invoke(create, {
      body: JSON.stringify({ company: "A", role: "B", status: "rejected", activity: "Phone screen" }),
    });
    const item = JSON.parse(res.body);
    expect(item.status).toBe("rejected");
    expect(item.activity).toBe("Phone screen");
  });
});

describe("list", () => {
  it("returns items from the scan", async () => {
    send.mockResolvedValue({ Items: [{ id: "1" }, { id: "2" }] });
    const res = await invoke(list, {});
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual([{ id: "1" }, { id: "2" }]);
  });

  it("returns an empty array when the table has no items", async () => {
    send.mockResolvedValue({});
    const res = await invoke(list, {});
    expect(JSON.parse(res.body)).toEqual([]);
  });
});

describe("update", () => {
  it("returns 400 when id is missing", async () => {
    const res = await invoke(update, { pathParameters: null, body: JSON.stringify({ status: "applied" }) });
    expect(res.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("returns 400 when no recognized fields are provided", async () => {
    const res = await invoke(update, { pathParameters: { id: "abc" }, body: JSON.stringify({ bogus: "x" }) });
    expect(res.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("builds an UpdateExpression only for the provided fields and returns 200", async () => {
    send.mockResolvedValue({ Attributes: { id: "abc", status: "interview" } });
    const res = await invoke(update, {
      pathParameters: { id: "abc" },
      body: JSON.stringify({ status: "interview" }),
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body)).toEqual({ id: "abc", status: "interview" });

    const command = send.mock.calls[0][0];
    expect(command.input.Key).toEqual({ id: "abc" });
    expect(command.input.UpdateExpression).toContain("#lastUpdated = :lastUpdated");
    expect(command.input.UpdateExpression).toContain("#f0 = :v0");
    expect(command.input.ExpressionAttributeNames["#f0"]).toBe("status");
    expect(command.input.ExpressionAttributeValues[":v0"]).toBe("interview");
  });

  it("ignores fields not in the allowed list", async () => {
    send.mockResolvedValue({ Attributes: {} });
    await invoke(update, {
      pathParameters: { id: "abc" },
      body: JSON.stringify({ status: "applied", id: "someone-elses-id", lastUpdated: "hacked" }),
    });

    // #lastUpdated is always set by the handler itself; the client-supplied
    // "id" and "lastUpdated" fields must not additionally appear as one of
    // the indexed #fN client-driven update fields.
    const command = send.mock.calls[0][0];
    const names: string[] = Object.entries(command.input.ExpressionAttributeNames)
      .filter(([key]) => key !== "#lastUpdated")
      .map(([, value]) => value as string);
    expect(names).toEqual(["status"]);
  });
});

describe("remove", () => {
  it("returns 400 when id is missing", async () => {
    const res = await invoke(remove, { pathParameters: null });
    expect(res.statusCode).toBe(400);
    expect(send).not.toHaveBeenCalled();
  });

  it("deletes the item and returns 204", async () => {
    send.mockResolvedValue({});
    const res = await invoke(remove, { pathParameters: { id: "abc" } });
    expect(res.statusCode).toBe(204);
    const command = send.mock.calls[0][0];
    expect(command.input.Key).toEqual({ id: "abc" });
  });
});
