"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Loader2, Quote, CheckSquare, Lightbulb, ArrowRight } from "lucide-react";
import type { MeetingAnalysis } from "@/db/schema";

type CitationItem = { text: string; citations: { timestamp: string }[] };
type ActionItemAnalysis = { task: string; assignee: string; dueDate?: string; citations: { timestamp: string }[] };

interface AnalysisPanelProps {
  meetingId: string;
  analysis: MeetingAnalysis | null;
  onHighlight?: (timestamps: string[]) => void;
}

export function AnalysisPanel({ meetingId, analysis: initialAnalysis, onHighlight }: AnalysisPanelProps) {
  const [analysis, setAnalysis] = useState(initialAnalysis);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function runAnalysis() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/meetings/${meetingId}/analyze`, { method: "POST" });
      const data = await res.json();
      if (!data.success) setError(data.error?.message ?? "Analysis failed");
      else setAnalysis(data.data.analysis);
    } catch { setError("Analysis failed. Please try again."); }
    finally { setLoading(false); }
  }

  function CitationChips({ citations }: { citations: { timestamp: string }[] }) {
    return (
      <div className="flex flex-wrap gap-1 mt-2">
        {citations.map((c, i) => (
          <button key={i} onClick={() => onHighlight?.([c.timestamp])}
            className="text-xs font-mono bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.5 rounded hover:bg-primary/20 transition-colors">
            [{c.timestamp}]
          </button>
        ))}
      </div>
    );
  }

  if (!analysis && !loading) {
    return (
      <div className="rounded-xl border border-dashed border-border p-8 text-center">
        <Sparkles className="h-10 w-10 mx-auto mb-3 text-primary/40" />
        <p className="text-sm text-muted-foreground mb-4">Run AI analysis to extract grounded insights with transcript citations.</p>
        <Button onClick={runAnalysis} size="sm">
          <Sparkles className="h-3.5 w-3.5 mr-1.5" />Analyze Meeting
        </Button>
        {error && <p className="text-destructive text-xs mt-3">{error}</p>}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-border p-8 text-center">
        <Loader2 className="h-8 w-8 mx-auto mb-3 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Analyzing transcript with AI...</p>
        <p className="text-xs text-muted-foreground/60 mt-1">This may take a moment</p>
      </div>
    );
  }

  const summary = (analysis?.summary as CitationItem[]) ?? [];
  const actionItems = (analysis?.actionItems as ActionItemAnalysis[]) ?? [];
  const decisions = (analysis?.decisions as CitationItem[]) ?? [];
  const followUps = (analysis?.followUps as CitationItem[]) ?? [];

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">AI Analysis</h3>
          <Button size="sm" variant="outline" onClick={runAnalysis} className="text-xs h-7">Re-analyze</Button>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="w-full">
            <TabsTrigger value="summary" className="flex-1 text-xs">Summary ({summary.length})</TabsTrigger>
            <TabsTrigger value="actions" className="flex-1 text-xs">Actions ({actionItems.length})</TabsTrigger>
            <TabsTrigger value="decisions" className="flex-1 text-xs">Decisions ({decisions.length})</TabsTrigger>
            <TabsTrigger value="followups" className="flex-1 text-xs">Follow-ups ({followUps.length})</TabsTrigger>
          </TabsList>

          {[
            { key: "summary", data: summary, icon: Quote, color: "text-primary", empty: "No summary points." },
            { key: "decisions", data: decisions, icon: ArrowRight, color: "text-amber-500", empty: "No decisions recorded." },
            { key: "followups", data: followUps, icon: Lightbulb, color: "text-purple-500", empty: "No follow-ups suggested." },
          ].map(({ key, data, icon: Icon, color, empty }) => (
            <TabsContent key={key} value={key} className="space-y-2 mt-3">
              {data.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-6">{empty}</p>
              ) : data.map((item, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-muted/50 rounded-xl p-3 border border-border">
                  <div className="flex gap-2">
                    <Icon className={`h-3.5 w-3.5 ${color} shrink-0 mt-0.5`} />
                    <p className="text-sm text-foreground">{item.text}</p>
                  </div>
                  <CitationChips citations={item.citations} />
                </motion.div>
              ))}
            </TabsContent>
          ))}

          <TabsContent value="actions" className="space-y-2 mt-3">
            {actionItems.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center py-6">No action items found.</p>
            ) : actionItems.map((a, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-muted/50 rounded-xl p-3 border border-border">
                <div className="flex gap-2">
                  <CheckSquare className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-foreground">{a.task}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{a.assignee}</Badge>
                      {a.dueDate && <span className="text-xs text-muted-foreground">Due: {new Date(a.dueDate).toLocaleDateString()}</span>}
                    </div>
                  </div>
                </div>
                <CitationChips citations={a.citations} />
              </motion.div>
            ))}
          </TabsContent>
        </Tabs>
      </motion.div>
    </AnimatePresence>
  );
}
