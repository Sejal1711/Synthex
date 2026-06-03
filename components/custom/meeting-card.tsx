"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Users, FileText, ArrowRight } from "lucide-react";
import type { Meeting } from "@/db/schema";

interface MeetingCardProps {
  meeting: Meeting;
  index?: number;
}

export function MeetingCard({ meeting, index = 0 }: MeetingCardProps) {
  const date = new Date(meeting.meetingDate).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
    >
      <Link href={`/meetings/${meeting.id}`}>
        <div className="group flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 hover:border-primary/40 hover:shadow-sm transition-all">
          <div className="flex items-center gap-3 min-w-0">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{meeting.title}</p>
              <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {date}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {(meeting.participants as string[]).length}
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {(meeting.transcript as unknown[]).length} lines
                </span>
              </div>
            </div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
        </div>
      </Link>
    </motion.div>
  );
}
