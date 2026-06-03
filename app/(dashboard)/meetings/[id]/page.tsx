import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { verifyToken } from "@/lib/auth/jwt";
import { getMeetingWithAnalysis } from "@/db/queries";
import { TranscriptViewer } from "@/components/custom/transcript-viewer";
import { AnalysisPanel } from "@/components/custom/analysis-panel";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users } from "lucide-react";

export default async function MeetingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");
  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const { id } = await params;
  const result = await getMeetingWithAnalysis(id, payload.sub);
  if (!result) notFound();

  const { meeting, analysis } = result;
  const participants = meeting.participants as string[];
  const transcript = meeting.transcript as { timestamp: string; speaker: string; text: string }[];

  const date = new Date(meeting.meetingDate).toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">{meeting.title}</h1>
        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{date}</span>
          <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{participants.length} participants</span>
        </div>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {participants.map((p) => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Transcript</h2>
          <TranscriptViewer transcript={transcript} />
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">
          <AnalysisPanel meetingId={id} analysis={analysis} />
        </div>
      </div>
    </div>
  );
}
