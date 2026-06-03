import {
  pgTable,
  uuid,
  text,
  timestamp,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";

export const actionStatusEnum = pgEnum("action_status", [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  participants: jsonb("participants").notNull().$type<string[]>(),
  meetingDate: timestamp("meeting_date").notNull(),
  transcript: jsonb("transcript")
    .notNull()
    .$type<{ timestamp: string; speaker: string; text: string }[]>(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const meetingAnalyses = pgTable("meeting_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id")
    .notNull()
    .unique()
    .references(() => meetings.id, { onDelete: "cascade" }),
  summary: jsonb("summary").$type<
    { text: string; citations: { timestamp: string }[] }[]
  >(),
  actionItems: jsonb("action_items").$type<
    {
      task: string;
      assignee: string;
      dueDate?: string;
      citations: { timestamp: string }[];
    }[]
  >(),
  decisions: jsonb("decisions").$type<
    { text: string; citations: { timestamp: string }[] }[]
  >(),
  followUps: jsonb("follow_ups").$type<
    { text: string; citations: { timestamp: string }[] }[]
  >(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const actionItems = pgTable("action_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  meetingId: uuid("meeting_id").references(() => meetings.id, {
    onDelete: "set null",
  }),
  task: text("task").notNull(),
  assignee: text("assignee").notNull(),
  status: actionStatusEnum("status").notNull().default("PENDING"),
  dueDate: timestamp("due_date"),
  citations: jsonb("citations").$type<{ timestamp: string }[]>(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const reminderHistory = pgTable("reminder_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  actionItemId: uuid("action_item_id")
    .notNull()
    .references(() => actionItems.id, { onDelete: "cascade" }),
  sentAt: timestamp("sent_at").notNull().defaultNow(),
  channel: text("channel").notNull().default("email"),
  success: text("success").notNull(),
  error: text("error"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Meeting = typeof meetings.$inferSelect;
export type NewMeeting = typeof meetings.$inferInsert;
export type MeetingAnalysis = typeof meetingAnalyses.$inferSelect;
export type ActionItem = typeof actionItems.$inferSelect;
export type NewActionItem = typeof actionItems.$inferInsert;
export type ReminderHistory = typeof reminderHistory.$inferSelect;
