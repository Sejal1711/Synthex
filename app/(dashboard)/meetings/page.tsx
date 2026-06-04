"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MeetingCard } from "@/components/custom/meeting-card";
import { Plus, Search, Calendar } from "lucide-react";
import type { Meeting } from "@/db/schema";

export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const LIMIT = 10;

  const fetchMeetings = useCallback(async (p: number, s: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
    if (s) params.set("search", s);
    const res = await fetch(`/api/meetings?${params}`);
    const data = await res.json();
    if (data.success) {
      const list = data.data.meetings as Meeting[];
      setMeetings(p === 1 ? list : (prev) => [...prev, ...list]);
      setHasMore(list.length === LIMIT);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchMeetings(1, search); }, 300);
    return () => clearTimeout(t);
  }, [search, fetchMeetings]);

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Synthex &rsaquo; Meetings
      </p>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Meetings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Manage and analyze your recorded meetings</p>
        </div>
        <Button asChild size="sm">
          <Link href="/meetings/new"><Plus className="h-3.5 w-3.5 mr-1.5" />New Meeting</Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search meetings..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading && meetings.length === 0 ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : meetings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center">
          <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            {search ? "No meetings match your search." : "No meetings yet."}
          </p>
        </div>
      ) : (
        <AnimatePresence>
          <div className="space-y-2">
            {meetings.map((m, i) => <MeetingCard key={m.id} meeting={m} index={i} />)}
          </div>
        </AnimatePresence>
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={() => { const n = page + 1; setPage(n); fetchMeetings(n, search); }} disabled={loading}>
            {loading ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </div>
  );
}
