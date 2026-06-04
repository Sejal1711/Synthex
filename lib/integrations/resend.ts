import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "reminders@yourdomain.com";

interface ReminderEmailOptions {
  to: string;
  task: string;
  assignee: string;
  dueDate: Date;
  meetingTitle?: string;
}

export async function sendReminderEmail(options: ReminderEmailOptions) {
  const { to, task, assignee, dueDate, meetingTitle } = options;

  const dueDateStr = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 24px; }
    .header { background: #3b82f6; color: white; padding: 20px 24px; border-radius: 8px 8px 0 0; }
    .body { background: #f8fafc; padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; }
    .badge { display: inline-block; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; padding: 4px 12px; border-radius: 9999px; font-size: 13px; font-weight: 600; margin-bottom: 16px; }
    .field { margin-bottom: 12px; }
    .label { font-size: 12px; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.05em; }
    .value { font-size: 16px; color: #1e293b; margin-top: 2px; }
    .footer { margin-top: 24px; font-size: 12px; color: #94a3b8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin:0;font-size:20px;">⏰ Action Item Reminder</h1>
    </div>
    <div class="body">
      <div class="badge">OVERDUE</div>
      ${meetingTitle ? `<div class="field"><div class="label">Meeting</div><div class="value">${meetingTitle}</div></div>` : ""}
      <div class="field"><div class="label">Task</div><div class="value">${task}</div></div>
      <div class="field"><div class="label">Assigned To</div><div class="value">${assignee}</div></div>
      <div class="field"><div class="label">Due Date</div><div class="value" style="color:#dc2626;">${dueDateStr}</div></div>
      <div class="footer">
        This is an automated reminder from Synthex Meeting Intelligence.
      </div>
    </div>
  </div>
</body>
</html>`;

  const result = await resend.emails.send({
    from: FROM,
    to,
    subject: `⏰ Overdue: ${task}`,
    html,
  });

  return result;
}
