import { tool } from "ai";
import { z } from "zod";

const citationSchema = z
  .array(z.object({ timestamp: z.string() }))
  .min(1, "At least one citation is required");

export interface ActionItemResult {
  task: string;
  assignee: string;
  dueDate?: string;
  citations: { timestamp: string }[];
}

export function createAddActionItemTool(accumulator: ActionItemResult[]) {
  return tool({
    description:
      "Extract an action item explicitly mentioned in the transcript. Only extract tasks that are clearly stated. MUST cite the transcript timestamp(s).",
    parameters: z.object({
      task: z.string().describe("The specific task to be done"),
      assignee: z
        .string()
        .describe("Name of the person responsible (from the transcript)"),
      dueDate: z
        .string()
        .optional()
        .describe("Due date if mentioned in the transcript (ISO 8601)"),
      citations: citationSchema.describe(
        "Transcript timestamps where this action item was mentioned"
      ),
    }),
    execute: async (args) => {
      accumulator.push(args);
      return { recorded: true };
    },
  });
}
