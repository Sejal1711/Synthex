import { NextRequest } from "next/server";

export function getTraceId(req: NextRequest): string {
  return req.headers.get("x-trace-id") ?? crypto.randomUUID();
}
