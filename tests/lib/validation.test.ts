import { describe, it, expect } from "vitest";
import { z } from "zod";

// Replicate the validation schemas used in routes
const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  participants: z.array(z.string().email("Invalid participant email")).min(1),
  meetingDate: z.string().datetime("Invalid meeting date"),
  transcript: z.array(z.object({
    timestamp: z.string().min(1),
    speaker: z.string().min(1),
    text: z.string().min(1),
  })).min(1, "Transcript must have at least one entry"),
});

const updateStatusSchema = z.object({
  status: z.enum(["PENDING", "IN_PROGRESS", "COMPLETED"]),
});

describe("Input Validation", () => {
  describe("createMeeting", () => {
    it("accepts valid meeting data", () => {
      const result = createMeetingSchema.safeParse({
        title: "Sprint Planning",
        participants: ["alice@example.com"],
        meetingDate: "2026-05-20T10:00:00Z",
        transcript: [{ timestamp: "00:10", speaker: "Alice", text: "Hello" }],
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing title", () => {
      const result = createMeetingSchema.safeParse({
        participants: ["alice@example.com"],
        meetingDate: "2026-05-20T10:00:00Z",
        transcript: [{ timestamp: "00:10", speaker: "Alice", text: "Hello" }],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid email in participants", () => {
      const result = createMeetingSchema.safeParse({
        title: "Test",
        participants: ["not-an-email"],
        meetingDate: "2026-05-20T10:00:00Z",
        transcript: [{ timestamp: "00:10", speaker: "Alice", text: "Hello" }],
      });
      expect(result.success).toBe(false);
      expect(result.error?.errors[0].message).toBe("Invalid participant email");
    });

    it("rejects empty transcript", () => {
      const result = createMeetingSchema.safeParse({
        title: "Test",
        participants: ["alice@example.com"],
        meetingDate: "2026-05-20T10:00:00Z",
        transcript: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects invalid date format", () => {
      const result = createMeetingSchema.safeParse({
        title: "Test",
        participants: ["alice@example.com"],
        meetingDate: "not-a-date",
        transcript: [{ timestamp: "00:10", speaker: "Alice", text: "Hello" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("updateStatus", () => {
    it("accepts valid statuses", () => {
      for (const s of ["PENDING", "IN_PROGRESS", "COMPLETED"]) {
        expect(updateStatusSchema.safeParse({ status: s }).success).toBe(true);
      }
    });

    it("rejects invalid status", () => {
      const result = updateStatusSchema.safeParse({ status: "DONE" });
      expect(result.success).toBe(false);
    });
  });
});
