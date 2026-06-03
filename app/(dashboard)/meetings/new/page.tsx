import { MeetingForm } from "@/components/custom/meeting-form";

export default function NewMeetingPage() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Hintro &rsaquo; Meetings &rsaquo; New
      </p>
      <div>
        <h1 className="text-xl font-bold text-foreground">New Meeting</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Record a meeting with transcript to generate AI insights</p>
      </div>
      <MeetingForm />
    </div>
  );
}
