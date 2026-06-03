import { NextRequest } from "next/server";
import { z } from "zod";
import { getActionItems, createActionItem } from "@/db/queries";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";

const createActionItemSchema = z.object({
  meetingId: z.string().uuid("Invalid meeting ID").optional(),
  task: z.string().min(1, "Task is required"),
  assignee: z.string().min(1, "Assignee is required"),
  dueDate: z.string().datetime("Invalid due date").optional(),
  citations: z
    .array(z.object({ timestamp: z.string() }))
    .optional(),
});

const statusValues = ["PENDING", "IN_PROGRESS", "COMPLETED"] as const;

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);

  try {
    const { searchParams } = new URL(req.url);
    const meetingId = searchParams.get("meetingId") ?? undefined;
    const assignee = searchParams.get("assignee") ?? undefined;
    const statusParam = searchParams.get("status");
    const status = statusValues.includes(statusParam as (typeof statusValues)[number])
      ? (statusParam as (typeof statusValues)[number])
      : undefined;

    const items = await getActionItems({ meetingId, assignee, status });

    logger.info(traceId, { method: "GET", path: "/api/action-items", status: 200 });
    return successResponse({ actionItems: items }, traceId);
  } catch (err) {
    logger.error(traceId, { method: "GET", path: "/api/action-items", error: err });
    return errorResponse("INTERNAL_ERROR", "Failed to fetch action items", traceId, 500);
  }
}

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);

  try {
    const body = await req.json();
    const parsed = createActionItemSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0].message,
        traceId,
        400,
        parsed.error.errors
      );
    }

    const item = await createActionItem({
      ...parsed.data,
      dueDate: parsed.data.dueDate ? new Date(parsed.data.dueDate) : undefined,
    });

    logger.info(traceId, { method: "POST", path: "/api/action-items", status: 201 });
    return successResponse({ actionItem: item }, traceId, 201);
  } catch (err) {
    logger.error(traceId, { method: "POST", path: "/api/action-items", error: err });
    return errorResponse("INTERNAL_ERROR", "Failed to create action item", traceId, 500);
  }
}
