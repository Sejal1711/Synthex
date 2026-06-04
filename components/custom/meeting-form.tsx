"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, ArrowRight, ClipboardPaste, Edit2 } from "lucide-react";

interface TranscriptEntry { timestamp: string; speaker: string; text: string; }

function parseTranscript(raw: string): TranscriptEntry[] {
  const lines = raw.split("\n").map((l) => l.trim()).filter(Boolean);
  const entries: TranscriptEntry[] = [];
  let autoMinute = 0;

  for (const line of lines) {
    // [00:10] Speaker: text  OR  00:10 Speaker: text
    const m1 = line.match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?\s+([^:]+):\s+(.+)$/);
    if (m1) { entries.push({ timestamp: m1[1], speaker: m1[2].trim(), text: m1[3].trim() }); continue; }
    // Speaker (00:10): text
    const m2 = line.match(/^([^(]+)\((\d{1,2}:\d{2}(?::\d{2})?)\):\s+(.+)$/);
    if (m2) { entries.push({ timestamp: m2[2].trim(), speaker: m2[1].trim(), text: m2[3].trim() }); continue; }
    // Speaker: text (no timestamp)
    const m3 = line.match(/^([^:]+):\s+(.+)$/);
    if (m3) {
      const mins = String(autoMinute).padStart(2, "0");
      entries.push({ timestamp: `${mins}:00`, speaker: m3[1].trim(), text: m3[2].trim() });
      autoMinute++;
    }
  }

  return entries.length > 0 ? entries : [];
}

export function MeetingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [meetingDate, setMeetingDate] = useState("");
  const [participants, setParticipants] = useState<string[]>(["", ""]);
  const [rawText, setRawText] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [parsed, setParsed] = useState(false);
  const [editing, setEditing] = useState(false);

  function addParticipant() { setParticipants((p) => [...p, ""]); }
  function updateParticipant(i: number, v: string) { setParticipants((p) => p.map((x, j) => j === i ? v : x)); }
  function removeParticipant(i: number) { setParticipants((p) => p.filter((_, j) => j !== i)); }
  function updateEntry(i: number, field: keyof TranscriptEntry, value: string) {
    setTranscript((t) => t.map((e, j) => j === i ? { ...e, [field]: value } : e));
  }
  function removeEntry(i: number) { setTranscript((t) => t.filter((_, j) => j !== i)); }
  function addEntry() { setTranscript((t) => [...t, { timestamp: "", speaker: "", text: "" }]); }

  function handleParse() {
    const entries = parseTranscript(rawText);
    if (entries.length === 0) { setError("Could not parse transcript. Make sure each line has a Speaker: text format."); return; }
    setTranscript(entries);
    setParsed(true);
    setError("");
  }

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
      {/* Step indicator */}
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

        {/* STEP 1 */}
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

        {/* STEP 2 */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="space-y-4">

            {/* PASTE BOX — shown until parsed */}
            {!parsed && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Paste Transcript</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Paste your full transcript. Supports <code className="bg-muted px-1 rounded">[00:10] Speaker: text</code> or <code className="bg-muted px-1 rounded">Speaker: text</code>
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder={`[00:01] Alice: We should launch next Friday.\n[00:20] Bob: I will prepare the release notes.\n[00:35] Alice: Let's also schedule a review call.`}
                    className="min-h-[260px] text-sm font-mono resize-y"
                  />
                  <Button onClick={handleParse} disabled={!rawText.trim()} className="w-full gap-2">
                    <ClipboardPaste className="h-4 w-4" />
                    Parse Transcript
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* PARSED PREVIEW */}
            {parsed && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-base">Transcript Ready</CardTitle>
                        <p className="text-xs text-muted-foreground mt-0.5">{transcript.length} entries parsed</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                          onClick={() => { setParsed(false); setEditing(false); }}>
                          Re-paste
                        </Button>
                        <Button size="sm" variant="outline" className="text-xs h-7 gap-1"
                          onClick={() => setEditing((e) => !e)}>
                          <Edit2 className="h-3 w-3" />
                          {editing ? "Done" : "Edit"}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {!editing ? (
                      // Read-only preview
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {transcript.map((entry, i) => (
                          <div key={i} className="flex gap-2 text-sm">
                            <span className="text-xs font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0 self-start mt-0.5">{entry.timestamp}</span>
                            <span className="font-medium text-foreground shrink-0">{entry.speaker}:</span>
                            <span className="text-muted-foreground">{entry.text}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      // Edit mode
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                        {transcript.map((entry, i) => (
                          <div key={i} className="grid grid-cols-[72px_1fr_auto] gap-2 items-start">
                            <Input value={entry.timestamp} onChange={(e) => updateEntry(i, "timestamp", e.target.value)} className="text-xs font-mono h-8" />
                            <div className="space-y-1.5">
                              <Input value={entry.speaker} onChange={(e) => updateEntry(i, "speaker", e.target.value)} placeholder="Speaker" className="text-xs h-8" />
                              <Textarea value={entry.text} onChange={(e) => updateEntry(i, "text", e.target.value)} className="text-xs min-h-[48px] resize-none" />
                            </div>
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeEntry(i)} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ))}
                        <Button type="button" variant="ghost" size="sm" onClick={addEntry} className="text-muted-foreground text-xs">
                          <Plus className="h-3.5 w-3.5 mr-1" />Add entry
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button className="flex-1" onClick={handleSubmit}
                disabled={loading || !parsed || transcript.filter((e) => e.speaker && e.text).length === 0}>
                {loading ? "Creating..." : "Create Meeting"}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
