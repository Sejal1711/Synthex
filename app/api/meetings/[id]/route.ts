import { NextRequest } from "next/server";
import { getMeetingWithAnalysis } from "@/db/queries";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";
import { cacheGet, cacheSet, CacheKeys, TTL } from "@/lib/cache";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(req);
  const userId = req.headers.get("x-user-id")!;
  const { id } = await params;

  try {
    // Try cache first
    const cacheKey = CacheKeys.meeting(id, userId);
    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.info(traceId, { method: "GET", path: `/api/meetings/${id}`, status: 200, cache: "HIT" });
      return successResponse(cached, traceId);
    }

    const result = await getMeetingWithAnalysis(id, userId);
    if (!result) {
      return errorResponse("NOT_FOUND", "Meeting not found", traceId, 404);
    }

    await cacheSet(cacheKey, result, TTL.meetings);

    logger.info(traceId, { method: "GET", path: `/api/meetings/${id}`, status: 200, cache: "MISS" });
    return successResponse(result, traceId);
  } catch (err) {
    logger.error(traceId, { method: "GET", path: `/api/meetings/${id}`, error: err });
    return errorResponse("INTERNAL_ERROR", "Failed to fetch meeting", traceId, 500);
  }
}
