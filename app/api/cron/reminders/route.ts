import { NextRequest } from "next/server";
import { getOverdueActionItems, getRecentReminder, createReminderHistory } from "@/db/queries";
import { sendReminderEmail } from "@/lib/integrations/resend";
import { successResponse, errorResponse } from "@/lib/utils/response";
import { getTraceId } from "@/lib/utils/trace";
import { logger } from "@/lib/utils/logger";

export async function GET(req: NextRequest) {
  const traceId = getTraceId(req);

  try {
    const overdueItems = await getOverdueActionItems();

    logger.info(traceId, {
      method: "GET",
      path: "/api/cron/reminders",
      message: `Found ${overdueItems.length} overdue items`,
    });

    const results = [];

    for (const item of overdueItems) {
      // Skip if reminder already sent in last 24h
      const recent = await getRecentReminder(item.id);
      if (recent) {
        results.push({ id: item.id, skipped: true, reason: "reminder sent recently" });
        continue;
      }

      // The assignee is used as the "to" email if it looks like an email,
      // otherwise fall back to a configured default
      const toEmail = item.assignee.includes("@")
        ? item.assignee
        : process.env.RESEND_FROM_EMAIL ?? "reminders@yourdomain.com";

      let success = false;
      let errorMsg: string | undefined;

      try {
        await sendReminderEmail({
          to: toEmail,
          task: item.task,
          assignee: item.assignee,
          dueDate: item.dueDate!,
          meetingTitle: undefined,
        });
        success = true;
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(traceId, { message: `Failed to send reminder for ${item.id}`, error: err });
      }

      await createReminderHistory({
        actionItemId: item.id,
        channel: "email",
        success: success ? "true" : "false",
        error: errorMsg,
      });

      results.push({ id: item.id, success, email: toEmail });
    }

    logger.info(traceId, {
      method: "GET",
      path: "/api/cron/reminders",
      status: 200,
      message: "Cron run complete",
    });

    return successResponse({ processed: results.length, results }, traceId);
  } catch (err) {
    logger.error(traceId, { method: "GET", path: "/api/cron/reminders", error: err });
    return errorResponse("INTERNAL_ERROR", "Cron job failed", traceId, 500);
  }
}
