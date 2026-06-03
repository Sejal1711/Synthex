import { NextRequest } from "next/server";
import { z } from "zod";
import { updateActionItemStatus, getActionItemById } from "@/db/queries";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"], {
    errorMap: () => ({
      message: "Status must be PENDING, IN_PROGRESS, or COMPLETED",
    }),
  }),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(req);
  const { id } = await params;

  try {
    const existing = await getActionItemById(id);
    if (!existing) {
      return errorResponse("NOT_FOUND", "Action item not found", traceId, 404);
    }

    const body = await req.json();
    const parsed = updateStatusSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0].message,
        traceId,
        400,
        parsed.error.errors
      );
    }

    const updated = await updateActionItemStatus(id, parsed.data.status);

    logger.info(traceId, {
      method: "PATCH",
      path: `/api/action-items/${id}/status`,
      status: 200,
    });
    return successResponse({ actionItem: updated }, traceId);
  } catch (err) {
    logger.error(traceId, {
      method: "PATCH",
      path: `/api/action-items/${id}/status`,
      error: err,
    });
    return errorResponse("INTERNAL_ERROR", "Failed to update status", traceId, 500);
  }
}
