# AI Approach

## Overview

The AI analysis pipeline uses the **Vercel AI SDK's tool-calling** feature with Claude Sonnet to extract grounded insights from meeting transcripts. The key design principle: every insight must be explicitly tied to a transcript segment via its timestamp.

---

## Prompt Design

### System Prompt Structure

```
You are a meeting intelligence assistant analyzing a transcript for the meeting: "{title}".

STRICT RULES:
1. ONLY extract information explicitly stated in the transcript.
2. Every item you record MUST include at least one citation.
3. Valid timestamps you may cite: [list of all timestamps in this transcript]
4. Never invent attendees, tasks, decisions, or outcomes.
5. If nothing qualifies for a category, do not add items.
```

The explicit listing of **valid timestamps** is critical — the model knows the exact set of timestamps it may reference, preventing fabricated timestamps.

### User Prompt

```
Analyze this meeting transcript:

[00:10] John: We should launch next Friday.
[00:20] Alice: I will prepare release notes.
...
```

Each entry is formatted as `[timestamp] speaker: text` for easy parsing.

---

## Citation Strategy

Citations are enforced at **three layers**:

| Layer | Mechanism |
|-------|-----------|
| Prompt | Explicit timestamps listed; model told it MUST cite |
| Tool schema | `citations: z.array(...).min(1)` — Zod rejects tool calls with no citations |
| DB storage | Analysis stored verbatim including all citations |

The `min(1)` Zod constraint is the strongest enforcement: the Vercel AI SDK validates tool parameters before calling `execute()`. If a citation is missing, the tool call fails and the model must retry.

---

## Tool-Calling Architecture

```
generateText({
  model: claude,
  system: groundingPrompt,
  prompt: transcriptText,
  tools: {
    addSummaryPoint,    // accumulates to summary[]
    addActionItem,      // accumulates to actionItems[]
    addDecision,        // accumulates to decisions[]
    addFollowUp,        // accumulates to followUps[]
    finishAnalysis,     // signals completion
  },
  maxSteps: 30,
})
```

The model calls tools iteratively:
1. Reads the transcript
2. Calls `addSummaryPoint` for each key theme
3. Calls `addActionItem` for each explicit task
4. Calls `addDecision` for each explicit decision
5. Calls `addFollowUp` for each follow-up suggestion
6. Calls `finishAnalysis` when done

Each call accumulates into typed arrays that become the final `AnalysisResult`.

---

## Hallucination Prevention

| Risk | Prevention |
|------|-----------|
| Invented action items | Tool descriptions say "Only extract tasks explicitly stated" |
| Fabricated assignees | System prompt: "Never invent attendees" |
| Missing citations | Zod `min(1)` rejects uncited items at schema level |
| Invalid timestamps | System prompt lists only valid timestamps |
| Over-extraction | Instructions: "If nothing qualifies, do not add items" |

The combination of prompt constraints + schema enforcement means the model physically cannot submit a tool call without a citation. It must either cite correctly or not call the tool at all.

---

## Output Validation

All tool results are validated by Zod before being accepted. After analysis completes:
1. The accumulated arrays are stored in `meetingAnalyses`
2. Action items are also written to the `actionItems` table for status tracking
3. The analysis is returned via the API with the full citation chain

---

## Known Limitations

1. **Token limit on large transcripts** — Very long meetings (1000+ lines) may exceed context limits. Consider chunking for production use.
2. **Timestamp format flexibility** — The model is told valid timestamps; if the transcript uses non-standard formats (e.g., "1:05:30"), citations may not perfectly match.
3. **Ambiguous attribution** — When multiple people say similar things, attribution can be uncertain. The model is instructed to cite all relevant timestamps.
4. **Follow-up inference** — Follow-ups are the most loosely grounded category; they require light inference from transcript content.
5. **Non-English transcripts** — Claude Sonnet handles multilingual transcripts, but grounding quality may vary.
