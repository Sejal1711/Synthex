import { describe, it, expect } from "vitest";
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

describe("AI Tools", () => {
  it("addSummaryPoint accumulates into array", async () => {
    const acc: SummaryPoint[] = [];
    const tool = createAddSummaryPointTool(acc);
    const input = { text: "Team plans to launch Friday.", citations: [{ timestamp: "00:10" }] };
    await tool.execute(input, { toolCallId: "1", messages: [] });
    expect(acc).toHaveLength(1);
    expect(acc[0].text).toBe(input.text);
    expect(acc[0].citations[0].timestamp).toBe("00:10");
  });

  it("addActionItem accumulates with assignee", async () => {
    const acc: ActionItemResult[] = [];
    const tool = createAddActionItemTool(acc);
    await tool.execute(
      { task: "Write release notes", assignee: "Alice", citations: [{ timestamp: "00:20" }] },
      { toolCallId: "2", messages: [] }
    );
    expect(acc[0].assignee).toBe("Alice");
    expect(acc[0].task).toBe("Write release notes");
  });

  it("addDecision accumulates correctly", async () => {
    const acc: DecisionResult[] = [];
    const tool = createAddDecisionTool(acc);
    await tool.execute(
      { text: "Launch on Friday", citations: [{ timestamp: "00:10" }] },
      { toolCallId: "3", messages: [] }
    );
    expect(acc).toHaveLength(1);
    expect(acc[0].text).toBe("Launch on Friday");
  });

  it("addFollowUp accumulates correctly", async () => {
    const acc: FollowUpResult[] = [];
    const tool = createAddFollowUpTool(acc);
    await tool.execute(
      { text: "Schedule review meeting", citations: [{ timestamp: "00:30" }] },
      { toolCallId: "4", messages: [] }
    );
    expect(acc[0].text).toBe("Schedule review meeting");
  });

  it("finishAnalysis returns done:true", async () => {
    const tool = createFinishAnalysisTool();
    const result = await tool.execute({}, { toolCallId: "5", messages: [] });
    expect(result).toEqual({ done: true });
  });

  it("multiple tool calls accumulate independently", async () => {
    const summaries: SummaryPoint[] = [];
    const actions: ActionItemResult[] = [];
    const summaryTool = createAddSummaryPointTool(summaries);
    const actionTool = createAddActionItemTool(actions);

    await summaryTool.execute({ text: "Point 1", citations: [{ timestamp: "00:01" }] }, { toolCallId: "a", messages: [] });
    await summaryTool.execute({ text: "Point 2", citations: [{ timestamp: "00:02" }] }, { toolCallId: "b", messages: [] });
    await actionTool.execute({ task: "Task 1", assignee: "Bob", citations: [{ timestamp: "00:03" }] }, { toolCallId: "c", messages: [] });

    expect(summaries).toHaveLength(2);
    expect(actions).toHaveLength(1);
  });
});
