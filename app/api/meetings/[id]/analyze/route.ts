import { NextRequest } from "next/server";
import { getMeetingById, upsertMeetingAnalysis, createActionItem } from "@/db/queries";
import { analyzeMeeting } from "@/lib/ai/analyze";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";
import { cacheGet, cacheSet, cacheDel, CacheKeys, TTL } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const traceId = getTraceId(req);
  const userId = req.headers.get("x-user-id")!;
  const { id } = await params;

  // Rate limit: 10 analyze calls per user per hour
  const rl = await checkRateLimit(userId, "analyze");
  if (!rl.allowed) {
    return errorResponse(
      "RATE_LIMIT_EXCEEDED",
      `Too many analysis requests. Try again in ${Math.ceil((rl.reset - Date.now()) / 60000)} minutes.`,
      traceId,
      429
    );
  }

  try {
    const meeting = await getMeetingById(id, userId);
    if (!meeting) {
      return errorResponse("NOT_FOUND", "Meeting not found", traceId, 404);
    }

    logger.info(traceId, {
      method: "POST",
      path: `/api/meetings/${id}/analyze`,
      message: "Starting AI analysis",
    });

    const result = await analyzeMeeting(meeting.title, meeting.transcript);

    const analysis = await upsertMeetingAnalysis({
      meetingId: id,
      summary: result.summary,
      actionItems: result.actionItems,
      decisions: result.decisions,
      followUps: result.followUps,
    });

    for (const item of result.actionItems) {
      await createActionItem({
        meetingId: id,
        task: item.task,
        assignee: item.assignee,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        citations: item.citations,
      });
    }

    // Cache the analysis result, invalidate meeting cache
    await Promise.all([
      cacheSet(CacheKeys.analysis(id), analysis, TTL.analysis),
      cacheDel(CacheKeys.meeting(id, userId)),
    ]);

    logger.info(traceId, {
      method: "POST",
      path: `/api/meetings/${id}/analyze`,
      status: 200,
      message: "Analysis complete",
    });

    return successResponse({ analysis }, traceId);
  } catch (err) {
    logger.error(traceId, {
      method: "POST",
      path: `/api/meetings/${id}/analyze`,
      error: err,
    });
    return errorResponse("INTERNAL_ERROR", "Analysis failed", traceId, 500);
  }
}
