"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight } from "lucide-react";

interface TranscriptEntry { timestamp: string; speaker: string; text: string; }

export function MeetingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [participants, setParticipants] = useState<string[]>(["", ""]);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([{ timestamp: "00:00", speaker: "", text: "" }]);

  function addParticipant() { setParticipants((p) => [...p, ""]); }
  function updateParticipant(i: number, v: string) { setParticipants((p) => p.map((x, j) => j === i ? v : x)); }
  function removeParticipant(i: number) { setParticipants((p) => p.filter((_, j) => j !== i)); }
  function addEntry() { setTranscript((t) => [...t, { timestamp: "", speaker: "", text: "" }]); }
  function updateEntry(i: number, field: keyof TranscriptEntry, value: string) { setTranscript((t) => t.map((e, j) => j === i ? { ...e, [field]: value } : e)); }
  function removeEntry(i: number) { setTranscript((t) => t.filter((_, j) => j !== i)); }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    const res = await fetch("/api/meetings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        meetingDate: new Date(meetingDate).toISOString(),
        participants: participants.filter((p) => p.trim()),
        transcript: transcript.filter((e) => e.timestamp && e.speaker && e.text),
      }),
    });
    const data = await res.json();
    setLoading(false);
    if (!data.success) { setError(data.error?.message ?? "Failed to create meeting"); return; }
    router.push(`/meetings/${data.data.meeting.id}`);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        {[1, 2].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors ${step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{s}</div>
            <span className={`text-sm ${step >= s ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s === 1 ? "Details" : "Transcript"}</span>
            {s < 2 && <div className="w-10 h-px bg-border" />}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">{error}</p>}

      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Meeting Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Sprint Planning Q2" />
                </div>
                <div className="space-y-1.5">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Participants</Label>
                  <div className="space-y-2">
                    {participants.map((p, i) => (
                      <div key={i} className="flex gap-2">
                        <Input type="email" value={p} onChange={(e) => updateParticipant(i, e.target.value)} placeholder="participant@example.com" />
                        {participants.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeParticipant(i)} className="text-muted-foreground hover:text-destructive shrink-0">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={addParticipant} className="text-muted-foreground hover:text-foreground mt-1">
                    <Plus className="h-3.5 w-3.5 mr-1" />Add participant
                  </Button>
                </div>
              </CardContent>
            </Card>
            <Button className="w-full" onClick={() => setStep(2)} disabled={!title || !meetingDate}>
              Next: Add Transcript <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Transcript</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {transcript.map((entry, i) => (
                  <div key={i} className="grid grid-cols-[80px_1fr_auto] gap-2 items-start">
                    <Input value={entry.timestamp} onChange={(e) => updateEntry(i, "timestamp", e.target.value)} placeholder="00:00" className="text-xs font-mono" />
                    <div className="space-y-2">
                      <Input value={entry.speaker} onChange={(e) => updateEntry(i, "speaker", e.target.value)} placeholder="Speaker" className="text-sm" />
                      <Textarea value={entry.text} onChange={(e) => updateEntry(i, "text", e.target.value)} placeholder="What was said..." className="text-sm min-h-[56px] resize-none" />
                    </div>
                    {transcript.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(i)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
                <Button type="button" variant="ghost" size="sm" onClick={addEntry} className="text-muted-foreground hover:text-foreground">
                  <Plus className="h-3.5 w-3.5 mr-1" />Add entry
                </Button>
              </CardContent>
            </Card>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit} disabled={loading || transcript.filter((e) => e.speaker && e.text).length === 0}>
                {loading ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
