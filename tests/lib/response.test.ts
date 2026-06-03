import { describe, it, expect } from "vitest";
import { successResponse, errorResponse } from "@/lib/utils/response";

describe("Response helpers", () => {
  it("successResponse returns correct shape", async () => {
    const res = successResponse({ foo: "bar" }, "trace-123");
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.traceId).toBe("trace-123");
    expect(body.data).toEqual({ foo: "bar" });
  });

  it("successResponse uses provided status", () => {
    const res = successResponse({}, "t", 201);
    expect(res.status).toBe(201);
  });

  it("errorResponse returns correct shape", async () => {
    const res = errorResponse("NOT_FOUND", "Item not found", "trace-abc", 404);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.traceId).toBe("trace-abc");
    expect(body.error.code).toBe("NOT_FOUND");
    expect(body.error.message).toBe("Item not found");
    expect(res.status).toBe(404);
  });

  it("errorResponse defaults to status 400", () => {
    const res = errorResponse("BAD", "bad input", "t");
    expect(res.status).toBe(400);
  });
});
