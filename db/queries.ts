import { eq, and, lt, gt, ne, desc, ilike } from "drizzle-orm";
import { db } from "./index";
import {
  users,
  meetings,
  meetingAnalyses,
  actionItems,
  reminderHistory,
} from "./schema";

// --- Users ---
export async function getUserByEmail(email: string) {
  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return result[0] ?? null;
}

export async function getUserById(id: string) {
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0] ?? null;
}

export async function createUser(data: {
  email: string;
  passwordHash: string;
  name: string;
}) {
  const result = await db.insert(users).values(data).returning();
  return result[0];
}

// --- Meetings ---
export async function getMeetings(
  userId: string,
  page = 1,
  limit = 10,
  search?: string
) {
  const offset = (page - 1) * limit;
  const conditions = [eq(meetings.createdBy, userId)];
  if (search) {
    conditions.push(ilike(meetings.title, `%${search}%`));
  }
  return db
    .select()
    .from(meetings)
    .where(and(...conditions))
    .orderBy(desc(meetings.createdAt))
    .limit(limit)
    .offset(offset);
}

export async function getMeetingById(id: string, userId: string) {
  const result = await db
    .select()
    .from(meetings)
    .where(and(eq(meetings.id, id), eq(meetings.createdBy, userId)))
    .limit(1);
  return result[0] ?? null;
}

export async function createMeeting(data: {
  title: string;
  participants: string[];
  meetingDate: Date;
  transcript: { timestamp: string; speaker: string; text: string }[];
  createdBy: string;
}) {
  const result = await db.insert(meetings).values(data).returning();
  return result[0];
}

export async function getMeetingWithAnalysis(id: string, userId: string) {
  const meeting = await getMeetingById(id, userId);
  if (!meeting) return null;
  const analysis = await db
    .select()
    .from(meetingAnalyses)
    .where(eq(meetingAnalyses.meetingId, id))
    .limit(1);
  return { meeting, analysis: analysis[0] ?? null };
}

// --- Meeting Analyses ---
export async function upsertMeetingAnalysis(data: {
  meetingId: string;
  summary: { text: string; citations: { timestamp: string }[] }[];
  actionItems: {
    task: string;
    assignee: string;
    dueDate?: string;
    citations: { timestamp: string }[];
  }[];
  decisions: { text: string; citations: { timestamp: string }[] }[];
  followUps: { text: string; citations: { timestamp: string }[] }[];
}) {
  const existing = await db
    .select()
    .from(meetingAnalyses)
    .where(eq(meetingAnalyses.meetingId, data.meetingId))
    .limit(1);

  if (existing[0]) {
    const result = await db
      .update(meetingAnalyses)
      .set({
        summary: data.summary,
        actionItems: data.actionItems,
        decisions: data.decisions,
        followUps: data.followUps,
      })
      .where(eq(meetingAnalyses.meetingId, data.meetingId))
      .returning();
    return result[0];
  } else {
    const result = await db.insert(meetingAnalyses).values(data).returning();
    return result[0];
  }
}

// --- Action Items ---
export async function getActionItems(filters: {
  userId?: string;
  meetingId?: string;
  status?: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  assignee?: string;
}) {
  const conditions = [];

  if (filters.meetingId) {
    conditions.push(eq(actionItems.meetingId, filters.meetingId));
  }
  if (filters.status) {
    conditions.push(eq(actionItems.status, filters.status));
  }
  if (filters.assignee) {
    conditions.push(ilike(actionItems.assignee, `%${filters.assignee}%`));
  }

  return db
    .select()
    .from(actionItems)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(actionItems.createdAt));
}

export async function getActionItemById(id: string) {
  const result = await db
    .select()
    .from(actionItems)
    .where(eq(actionItems.id, id))
    .limit(1);
  return result[0] ?? null;
}

export async function createActionItem(data: {
  meetingId?: string;
  task: string;
  assignee: string;
  dueDate?: Date;
  citations?: { timestamp: string }[];
}) {
  const result = await db.insert(actionItems).values(data).returning();
  return result[0];
}

export async function updateActionItemStatus(
  id: string,
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED"
) {
  const result = await db
    .update(actionItems)
    .set({ status, updatedAt: new Date() })
    .where(eq(actionItems.id, id))
    .returning();
  return result[0] ?? null;
}

export async function getOverdueActionItems() {
  return db
    .select()
    .from(actionItems)
    .where(
      and(
        ne(actionItems.status, "COMPLETED"),
        lt(actionItems.dueDate, new Date())
      )
    )
    .orderBy(actionItems.dueDate);
}

// --- Reminder History ---
export async function getRecentReminder(actionItemId: string) {
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await db
    .select()
    .from(reminderHistory)
    .where(
      and(
        eq(reminderHistory.actionItemId, actionItemId),
        gt(reminderHistory.sentAt, cutoff)
      )
    )
    .limit(1);
  return result[0] ?? null;
}

export async function createReminderHistory(data: {
  actionItemId: string;
  channel: string;
  success: string;
  error?: string;
}) {
  const result = await db.insert(reminderHistory).values(data).returning();
  return result[0];
}

// --- Stats ---
export async function getDashboardStats(userId: string) {
  const [allMeetings, allActionItems] = await Promise.all([
    db
      .select()
      .from(meetings)
      .where(eq(meetings.createdBy, userId)),
    db.select().from(actionItems),
  ]);

  const overdue = allActionItems.filter(
    (item) =>
      item.status !== "COMPLETED" &&
      item.dueDate &&
      item.dueDate < new Date()
  );

  const openItems = allActionItems.filter(
    (item) => item.status !== "COMPLETED"
  );

  return {
    totalMeetings: allMeetings.length,
    openActionItems: openItems.length,
    overdueItems: overdue.length,
  };
}

export async function getRecentMeetings(userId: string, limit = 5) {
  return db
    .select()
    .from(meetings)
    .where(eq(meetings.createdBy, userId))
    .orderBy(desc(meetings.createdAt))
    .limit(limit);
}
