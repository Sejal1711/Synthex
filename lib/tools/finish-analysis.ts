import { tool } from "ai";
import { z } from "zod";

export function createFinishAnalysisTool() {
  return tool({
    description:
      "Call this tool when you have finished extracting all summary points, action items, decisions, and follow-ups from the transcript.",
    parameters: z.object({}),
    execute: async () => ({ done: true }),
  });
}
