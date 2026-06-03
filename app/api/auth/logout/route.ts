import { NextRequest } from "next/server";
import { successResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);
  const response = successResponse({ message: "Logged out" }, traceId);
  response.cookies.delete("token");
  return response;
}
