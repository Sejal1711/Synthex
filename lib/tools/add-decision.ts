import { tool } from "ai";
import { z } from "zod";

const citationSchema = z
  .array(z.object({ timestamp: z.string() }))
  .min(1, "At least one citation is required");

export interface DecisionResult {
  text: string;
  citations: { timestamp: string }[];
}

export function createAddDecisionTool(accumulator: DecisionResult[]) {
  return tool({
    description:
      "Record a decision that was explicitly made during the meeting. Only record decisions clearly stated in the transcript. MUST cite the timestamp(s).",
    parameters: z.object({
      text: z.string().describe("The decision that was made"),
      citations: citationSchema.describe(
        "Transcript timestamps where this decision was made"
      ),
    }),
    execute: async (args) => {
      accumulator.push(args);
      return { recorded: true };
    },
  });
}
