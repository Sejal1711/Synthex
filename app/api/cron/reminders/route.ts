import { NextRequest } from "next/server";
import { getOverdueActionItems, getRecentReminder, createReminderHistory } from "@/db/queries";
import { sendReminderEmail } from "@/lib/integrations/resend";
import { sendDiscordReminder } from "@/lib/integrations/discord";
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
      const recent = await getRecentReminder(item.id);
      if (recent) {
        results.push({ id: item.id, skipped: true, reason: "reminder sent recently" });
        continue;
      }

      let emailSuccess = false;
      let discordSuccess = false;
      let errorMsg: string | undefined;

      // Send Discord notification
      try {
        const discordResult = await sendDiscordReminder({
          task: item.task,
          assignee: item.assignee,
          dueDate: item.dueDate!,
        });
        discordSuccess = discordResult.success;
        if (!discordResult.success) errorMsg = discordResult.error;
      } catch (err) {
        errorMsg = err instanceof Error ? err.message : String(err);
        logger.error(traceId, { message: `Discord reminder failed for ${item.id}`, error: err });
      }

      // Send email if assignee looks like an email
      if (item.assignee.includes("@")) {
        try {
          await sendReminderEmail({
            to: item.assignee,
            task: item.task,
            assignee: item.assignee,
            dueDate: item.dueDate!,
          });
          emailSuccess = true;
        } catch (err) {
          logger.error(traceId, { message: `Email reminder failed for ${item.id}`, error: err });
        }
      }

      const success = discordSuccess || emailSuccess;

      await createReminderHistory({
        actionItemId: item.id,
        channel: "discord+email",
        success: success ? "true" : "false",
        error: errorMsg,
      });

      results.push({
        id: item.id,
        task: item.task,
        discord: discordSuccess,
        email: emailSuccess,
      });
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
