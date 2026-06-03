import { tool } from "ai";
import { z } from "zod";

const citationSchema = z
  .array(z.object({ timestamp: z.string() }))
  .min(1, "At least one citation is required");

export interface FollowUpResult {
  text: string;
  citations: { timestamp: string }[];
}

export function createAddFollowUpTool(accumulator: FollowUpResult[]) {
  return tool({
    description:
      "Suggest a follow-up action based on what was discussed in the transcript. Must be grounded in explicit transcript content. MUST cite the timestamp(s).",
    parameters: z.object({
      text: z.string().describe("The follow-up suggestion"),
      citations: citationSchema.describe(
        "Transcript timestamps that justify this follow-up"
      ),
    }),
    execute: async (args) => {
      accumulator.push(args);
      return { recorded: true };
    },
  });
}
