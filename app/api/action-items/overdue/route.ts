import { NextRequest } from "next/server";
import { getOverdueActionItems } from "@/db/queries";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);

  try {
    const items = await getOverdueActionItems();

    logger.info(traceId, {
      method: "GET",
      path: "/api/action-items/overdue",
      status: 200,
    });
    return successResponse({ actionItems: items, count: items.length }, traceId);
  } catch (err) {
    logger.error(traceId, {
      method: "GET",
      path: "/api/action-items/overdue",
      error: err,
    });
    return errorResponse(
      "INTERNAL_ERROR",
      "Failed to fetch overdue items",
      traceId,
      500
    );
  }
}
