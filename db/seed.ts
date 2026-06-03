import { config } from "dotenv";
config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

const DEMO_EMAIL = "demo@synthex.app";
const DEMO_PASSWORD = "demo1234";

async function seed() {
  console.log("Seeding demo data...");

  // 1. Create demo user
  const existing = await db.select().from(schema.users).where(eq(schema.users.email, DEMO_EMAIL)).limit(1);
  let userId: string;

  if (existing[0]) {
    userId = existing[0].id;
    console.log("Demo user already exists, skipping creation.");
  } else {
    const passwordHash = await hash(DEMO_PASSWORD, 12);
    const [user] = await db.insert(schema.users).values({
      email: DEMO_EMAIL,
      passwordHash,
      name: "Demo User",
    }).returning();
    userId = user.id;
    console.log("Created demo user:", DEMO_EMAIL);
  }

  // 2. Create Meeting 1 — Sprint Planning
  const [meeting1] = await db.insert(schema.meetings).values({
    title: "Q2 Sprint Planning",
    participants: ["alice@acme.com", "bob@acme.com", "carol@acme.com"],
    meetingDate: new Date("2026-05-20T10:00:00Z"),
    transcript: [
      { timestamp: "00:02", speaker: "Alice", text: "Let's kick off Q2 sprint planning. Our goal is to ship the new dashboard by end of month." },
      { timestamp: "00:45", speaker: "Bob", text: "I'll take ownership of the backend API refactor. Should be done by Friday." },
      { timestamp: "01:20", speaker: "Carol", text: "I can handle the frontend components. I'll need designs from Alice first." },
      { timestamp: "02:00", speaker: "Alice", text: "I'll send the Figma designs to Carol by tomorrow morning." },
      { timestamp: "02:30", speaker: "Bob", text: "We've decided to use PostgreSQL instead of MongoDB for this sprint." },
      { timestamp: "03:10", speaker: "Carol", text: "Should we schedule a mid-sprint review on Wednesday?" },
      { timestamp: "03:30", speaker: "Alice", text: "Good idea. Let's block Wednesday at 2 PM for the review." },
      { timestamp: "04:00", speaker: "Bob", text: "I'll set up the staging environment by Monday." },
    ],
    createdBy: userId,
  }).returning();

  await db.insert(schema.meetingAnalyses).values({
    meetingId: meeting1.id,
    summary: [
      { text: "Team is targeting a new dashboard release by end of Q2.", citations: [{ timestamp: "00:02" }] },
      { text: "PostgreSQL was chosen over MongoDB for the sprint database.", citations: [{ timestamp: "02:30" }] },
      { text: "A mid-sprint review is scheduled for Wednesday at 2 PM.", citations: [{ timestamp: "03:30" }] },
    ],
    actionItems: [
      { task: "Complete backend API refactor", assignee: "Bob", dueDate: "2026-05-24T17:00:00Z", citations: [{ timestamp: "00:45" }] },
      { task: "Send Figma designs to Carol", assignee: "Alice", dueDate: "2026-05-21T09:00:00Z", citations: [{ timestamp: "02:00" }] },
      { task: "Build frontend dashboard components", assignee: "Carol", dueDate: "2026-05-30T17:00:00Z", citations: [{ timestamp: "01:20" }] },
      { task: "Set up staging environment", assignee: "Bob", dueDate: "2026-05-25T17:00:00Z", citations: [{ timestamp: "04:00" }] },
    ],
    decisions: [
      { text: "Use PostgreSQL instead of MongoDB for this sprint.", citations: [{ timestamp: "02:30" }] },
      { text: "Mid-sprint review blocked for Wednesday at 2 PM.", citations: [{ timestamp: "03:30" }] },
    ],
    followUps: [
      { text: "Confirm designs are received by Carol before frontend work begins.", citations: [{ timestamp: "01:20" }, { timestamp: "02:00" }] },
      { text: "Verify staging environment is ready before mid-sprint review.", citations: [{ timestamp: "03:30" }, { timestamp: "04:00" }] },
    ],
  });

  // 3. Create Meeting 2 — Product Review
  const [meeting2] = await db.insert(schema.meetings).values({
    title: "Product Review — May Release",
    participants: ["alice@acme.com", "david@acme.com", "eva@acme.com"],
    meetingDate: new Date("2026-05-22T14:00:00Z"),
    transcript: [
      { timestamp: "00:05", speaker: "David", text: "The May release has 3 critical bugs reported by QA that need to be fixed before launch." },
      { timestamp: "00:50", speaker: "Eva", text: "I've identified the root cause of bug #1 — it's a race condition in the auth flow. I'll fix it today." },
      { timestamp: "01:30", speaker: "Alice", text: "Bug #2 is a UI regression in the mobile view. I'll assign it to the frontend team." },
      { timestamp: "02:10", speaker: "David", text: "We're pushing the release date from May 28 to June 3 to allow proper QA time." },
      { timestamp: "02:45", speaker: "Eva", text: "I'll write regression tests for all three bugs once fixes are in." },
      { timestamp: "03:20", speaker: "Alice", text: "Customer success needs release notes by June 1st." },
    ],
    createdBy: userId,
  }).returning();

  await db.insert(schema.meetingAnalyses).values({
    meetingId: meeting2.id,
    summary: [
      { text: "3 critical bugs must be resolved before the May release launches.", citations: [{ timestamp: "00:05" }] },
      { text: "Release date has been pushed from May 28 to June 3 for additional QA time.", citations: [{ timestamp: "02:10" }] },
    ],
    actionItems: [
      { task: "Fix race condition in auth flow (Bug #1)", assignee: "Eva", dueDate: "2026-05-22T18:00:00Z", citations: [{ timestamp: "00:50" }] },
      { task: "Fix mobile UI regression (Bug #2)", assignee: "Alice", dueDate: "2026-05-23T17:00:00Z", citations: [{ timestamp: "01:30" }] },
      { task: "Write regression tests for all 3 bugs", assignee: "Eva", dueDate: "2026-05-30T17:00:00Z", citations: [{ timestamp: "02:45" }] },
      { task: "Prepare release notes for customer success", assignee: "Alice", dueDate: "2026-06-01T17:00:00Z", citations: [{ timestamp: "03:20" }] },
    ],
    decisions: [
      { text: "Release date moved from May 28 to June 3.", citations: [{ timestamp: "02:10" }] },
    ],
    followUps: [
      { text: "Confirm all 3 bugs are resolved before scheduling final QA pass.", citations: [{ timestamp: "00:05" }, { timestamp: "02:45" }] },
    ],
  });

  // 4. Create Meeting 3 — Team Standup
  const [meeting3] = await db.insert(schema.meetings).values({
    title: "Weekly Team Standup",
    participants: ["alice@acme.com", "bob@acme.com"],
    meetingDate: new Date("2026-05-27T09:00:00Z"),
    transcript: [
      { timestamp: "00:10", speaker: "Alice", text: "Quick update — designs are done and handed off to Carol." },
      { timestamp: "00:40", speaker: "Bob", text: "API refactor is 80% complete. I'll be done by EOD." },
      { timestamp: "01:10", speaker: "Alice", text: "We need to update the API documentation before the June release." },
      { timestamp: "01:40", speaker: "Bob", text: "I'll take care of the API docs this week." },
    ],
    createdBy: userId,
  }).returning();

  await db.insert(schema.meetingAnalyses).values({
    meetingId: meeting3.id,
    summary: [
      { text: "Designs have been handed off to Carol. API refactor is 80% complete.", citations: [{ timestamp: "00:10" }, { timestamp: "00:40" }] },
    ],
    actionItems: [
      { task: "Update API documentation before June release", assignee: "Bob", dueDate: "2026-05-31T17:00:00Z", citations: [{ timestamp: "01:10" }, { timestamp: "01:40" }] },
    ],
    decisions: [],
    followUps: [
      { text: "Verify Carol has received and reviewed the designs.", citations: [{ timestamp: "00:10" }] },
    ],
  });

  // 5. Create Action Items with various statuses
  await db.insert(schema.actionItems).values([
    {
      meetingId: meeting1.id,
      task: "Complete backend API refactor",
      assignee: "bob@acme.com",
      status: "COMPLETED",
      dueDate: new Date("2026-05-24T17:00:00Z"),
      citations: [{ timestamp: "00:45" }],
    },
    {
      meetingId: meeting1.id,
      task: "Send Figma designs to Carol",
      assignee: "alice@acme.com",
      status: "COMPLETED",
      dueDate: new Date("2026-05-21T09:00:00Z"),
      citations: [{ timestamp: "02:00" }],
    },
    {
      meetingId: meeting1.id,
      task: "Build frontend dashboard components",
      assignee: "carol@acme.com",
      status: "IN_PROGRESS",
      dueDate: new Date("2026-05-30T17:00:00Z"),
      citations: [{ timestamp: "01:20" }],
    },
    {
      meetingId: meeting1.id,
      task: "Set up staging environment",
      assignee: "bob@acme.com",
      status: "PENDING",
      dueDate: new Date("2025-05-25T17:00:00Z"), // overdue
      citations: [{ timestamp: "04:00" }],
    },
    {
      meetingId: meeting2.id,
      task: "Fix race condition in auth flow",
      assignee: "eva@acme.com",
      status: "COMPLETED",
      dueDate: new Date("2026-05-22T18:00:00Z"),
      citations: [{ timestamp: "00:50" }],
    },
    {
      meetingId: meeting2.id,
      task: "Fix mobile UI regression",
      assignee: "alice@acme.com",
      status: "COMPLETED",
      dueDate: new Date("2026-05-23T17:00:00Z"),
      citations: [{ timestamp: "01:30" }],
    },
    {
      meetingId: meeting2.id,
      task: "Write regression tests for all 3 bugs",
      assignee: "eva@acme.com",
      status: "IN_PROGRESS",
      dueDate: new Date("2025-05-30T17:00:00Z"), // overdue
      citations: [{ timestamp: "02:45" }],
    },
    {
      meetingId: meeting2.id,
      task: "Prepare release notes for customer success",
      assignee: "alice@acme.com",
      status: "PENDING",
      dueDate: new Date("2025-06-01T17:00:00Z"), // overdue
      citations: [{ timestamp: "03:20" }],
    },
    {
      meetingId: meeting3.id,
      task: "Update API documentation before June release",
      assignee: "bob@acme.com",
      status: "PENDING",
      dueDate: new Date("2026-05-31T17:00:00Z"),
      citations: [{ timestamp: "01:40" }],
    },
  ]);

  console.log("✓ Created 3 meetings with analyses");
  console.log("✓ Created 9 action items (mixed statuses + 3 overdue)");
  console.log("\nDemo credentials:");
  console.log("  Email:    demo@synthex.app");
  console.log("  Password: demo1234");
  console.log("  URL:      https://synthex-nine.vercel.app");
}

seed().catch(console.error);
