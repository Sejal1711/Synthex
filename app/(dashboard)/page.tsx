import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { verifyToken } from "@/lib/auth/jwt";
import { getDashboardStats, getRecentMeetings } from "@/db/queries";
import { MeetingCard } from "@/components/custom/meeting-card";
import { Button } from "@/components/ui/button";
import { Calendar, CheckSquare, AlertCircle, Plus } from "lucide-react";

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) redirect("/login");

  const payload = await verifyToken(token);
  if (!payload) redirect("/login");

  const [stats, recentMeetings] = await Promise.all([
    getDashboardStats(payload.sub),
    getRecentMeetings(payload.sub, 5),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Your meeting intelligence overview</p>
        </div>
        <Button asChild size="sm">
          <Link href="/meetings/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New Meeting</Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total Meetings", value: stats.totalMeetings, icon: Calendar, color: "text-primary", bg: "bg-primary/10" },
          { label: "Open Action Items", value: stats.openActionItems, icon: CheckSquare, color: "text-amber-500", bg: "bg-amber-500/10" },
          { label: "Overdue Items", value: stats.overdueItems, icon: AlertCircle, color: "text-destructive", bg: "bg-destructive/10" },
        ].map(({ label, value, icon: Icon, color, bg }, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-5 flex items-center gap-4">
            <div className={`p-2.5 rounded-lg ${bg} ${color}`}><Icon className="h-5 w-5" /></div>
            <div>
              <p className="text-2xl font-bold text-foreground">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-foreground">Recent Meetings</h2>
          <Link href="/meetings" className="text-xs text-primary hover:underline">View all</Link>
        </div>
        {recentMeetings.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No meetings yet.</p>
            <Button asChild size="sm" className="mt-4"><Link href="/meetings/new">Create first meeting</Link></Button>
          </div>
        ) : (
          <div className="space-y-2">
            {recentMeetings.map((m, i) => <MeetingCard key={m.id} meeting={m} index={i} />)}
          </div>
        )}
      </div>
    </div>
  );
}
