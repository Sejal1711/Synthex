"use client";

import { motion } from "framer-motion";

interface TranscriptEntry { timestamp: string; speaker: string; text: string; }

export function TranscriptViewer({ transcript, highlightTimestamps = [] }: { transcript: TranscriptEntry[]; highlightTimestamps?: string[]; }) {
  const hl = new Set(highlightTimestamps);
  return (
    <div className="space-y-2">
      {transcript.map((entry, i) => (
        <motion.div key={i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
          className={`rounded-xl p-3 transition-colors ${hl.has(entry.timestamp) ? "bg-primary/10 border border-primary/25" : "bg-muted/50 border border-transparent"}`}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono bg-primary/15 text-primary px-1.5 py-0.5 rounded">{entry.timestamp}</span>
            <span className="text-xs font-semibold text-foreground">{entry.speaker}</span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{entry.text}</p>
        </motion.div>
      ))}
    </div>
  );
}
