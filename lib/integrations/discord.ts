interface DiscordReminderOptions {
  task: string;
  assignee: string;
  dueDate: Date;
  meetingTitle?: string;
}

export async function sendDiscordReminder(options: DiscordReminderOptions) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: "DISCORD_WEBHOOK_URL not set" };

  const { task, assignee, dueDate, meetingTitle } = options;

  const dueDateStr = dueDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const payload = {
    username: "Synthex",
    avatar_url: "https://cdn.discordapp.com/embed/avatars/0.png",
    embeds: [
      {
        title: "⏰ Overdue Action Item",
        color: 0xe74c3c,
        fields: [
          ...(meetingTitle ? [{ name: "Meeting", value: meetingTitle, inline: false }] : []),
          { name: "Task", value: task, inline: false },
          { name: "Assigned To", value: assignee, inline: true },
          { name: "Due Date", value: dueDateStr, inline: true },
        ],
        footer: { text: "Synthex Meeting Intelligence" },
        timestamp: new Date().toISOString(),
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const error = await res.text();
    return { success: false, error };
  }

  return { success: true };
}
