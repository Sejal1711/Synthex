import { generateText } from "ai";
import { claude } from "@/ai/index";
import {
  createAddSummaryPointTool,
  createAddActionItemTool,
  createAddDecisionTool,
  createAddFollowUpTool,
  createFinishAnalysisTool,
  type SummaryPoint,
  type ActionItemResult,
  type DecisionResult,
  type FollowUpResult,
} from "@/lib/tools/index";

interface TranscriptEntry {
  timestamp: string;
  speaker: string;
  text: string;
}

export interface AnalysisResult {
  summary: SummaryPoint[];
  actionItems: ActionItemResult[];
  decisions: DecisionResult[];
  followUps: FollowUpResult[];
}

export async function analyzeMeeting(
  title: string,
  transcript: TranscriptEntry[]
): Promise<AnalysisResult> {
  const summary: SummaryPoint[] = [];
  const actionItems: ActionItemResult[] = [];
  const decisions: DecisionResult[] = [];
  const followUps: FollowUpResult[] = [];

  const validTimestamps = transcript.map((e) => e.timestamp);

  const transcriptText = transcript
    .map((e) => `[${e.timestamp}] ${e.speaker}: ${e.text}`)
    .join("\n");

  const systemPrompt = `You are a meeting intelligence assistant analyzing a transcript for the meeting: "${title}".

STRICT RULES:
1. ONLY extract information explicitly stated in the transcript. Never invent or infer beyond what is said.
2. Every item you record MUST include at least one citation referencing a valid transcript timestamp.
3. Valid timestamps you may cite: ${validTimestamps.join(", ")}
4. Never invent attendees, tasks, decisions, or outcomes not present in the transcript.
5. If nothing qualifies for a category, do not add items to it.

Use the tools to record each piece of analysis:
- Use addSummaryPoint for each key theme or outcome
- Use addActionItem for each explicit task assigned to someone
- Use addDecision for each explicit decision made
- Use addFollowUp for each follow-up suggestion grounded in the transcript
- Call finishAnalysis when complete`;

  const userPrompt = `Analyze this meeting transcript:\n\n${transcriptText}`;

  await generateText({
    model: claude,
    system: systemPrompt,
    prompt: userPrompt,
    tools: {
      addSummaryPoint: createAddSummaryPointTool(summary),
      addActionItem: createAddActionItemTool(actionItems),
      addDecision: createAddDecisionTool(decisions),
      addFollowUp: createAddFollowUpTool(followUps),
      finishAnalysis: createFinishAnalysisTool(),
    },
    maxSteps: 30,
  });

  return { summary, actionItems, decisions, followUps };
}
