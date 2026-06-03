import { NextRequest } from "next/server";
import { z } from "zod";
import { getMeetings, createMeeting } from "@/db/queries";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";

const transcriptEntrySchema = z.object({
  timestamp: z.string().min(1, "Timestamp is required"),
  speaker: z.string().min(1, "Speaker is required"),
  text: z.string().min(1, "Text is required"),
});

const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  participants: z
    .array(z.string().email("Invalid participant email"))
    .min(1, "At least one participant is required"),
  meetingDate: z.string().datetime("Invalid meeting date"),
  transcript: z
    .array(transcriptEntrySchema)
    .min(1, "Transcript must have at least one entry"),
});

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);
  const userId = req.headers.get("x-user-id")!;

  try {
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, parseInt(searchParams.get("limit") ?? "10"));
    const search = searchParams.get("search") ?? undefined;

    const data = await getMeetings(userId, page, limit, search);

    logger.info(traceId, { method: "GET", path: "/api/meetings", status: 200 });
    return successResponse({ meetings: data, page, limit }, traceId);
  } catch (err) {
    logger.error(traceId, { method: "GET", path: "/api/meetings", error: err });
    return errorResponse("INTERNAL_ERROR", "Failed to fetch meetings", traceId, 500);
  }
}

export async function POST(req: NextRequest) {
  const traceId = getTraceId(req);
  const userId = req.headers.get("x-user-id")!;

  try {
    const body = await req.json();
    const parsed = createMeetingSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        "VALIDATION_ERROR",
        parsed.error.errors[0].message,
        traceId,
        400,
        parsed.error.errors
      );
    }

    const meeting = await createMeeting({
      ...parsed.data,
      meetingDate: new Date(parsed.data.meetingDate),
      createdBy: userId,
    });

    logger.info(traceId, { method: "POST", path: "/api/meetings", status: 201 });
    return successResponse({ meeting }, traceId, 201);
  } catch (err) {
    logger.error(traceId, { method: "POST", path: "/api/meetings", error: err });
    return errorResponse("INTERNAL_ERROR", "Failed to create meeting", traceId, 500);
  }
}
