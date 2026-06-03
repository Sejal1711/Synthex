import { tool } from "ai";
import { z } from "zod";

const citationSchema = z
  .array(z.object({ timestamp: z.string() }))
  .min(1, "At least one citation is required");

export interface SummaryPoint {
  text: string;
  citations: { timestamp: string }[];
}

export function createAddSummaryPointTool(accumulator: SummaryPoint[]) {
  return tool({
    description:
      "Add a summary point that captures a key theme or outcome from the meeting. MUST cite the transcript timestamp(s) it is derived from.",
    parameters: z.object({
      text: z.string().describe("The summary point text"),
      citations: citationSchema.describe(
        "Transcript timestamps this summary is derived from"
      ),
    }),
    execute: async (args) => {
      accumulator.push(args);
      return { recorded: true };
    },
  });
}
