"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "./status-badge";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, AlertCircle, CheckSquare } from "lucide-react";
import type { ActionItem } from "@/db/schema";

interface ActionItemCardProps {
  item: ActionItem;
  onStatusChange?: (id: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") => void;
  index?: number;
}

export function ActionItemCard({ item, onStatusChange, index = 0 }: ActionItemCardProps) {
  const [loading, setLoading] = useState(false);
  const isOverdue =
    item.dueDate && new Date(item.dueDate) < new Date() && item.status !== "COMPLETED";

  const dueDate = item.dueDate
    ? new Date(item.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const nextStatus: Record<string, "PENDING" | "IN_PROGRESS" | "COMPLETED"> = {
    PENDING: "IN_PROGRESS",
    IN_PROGRESS: "COMPLETED",
    COMPLETED: "PENDING",
  };

  async function handleStatusChange() {
    const next = nextStatus[item.status];
    setLoading(true);
    try {
      const res = await fetch(`/api/action-items/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (res.ok && onStatusChange) onStatusChange(item.id, next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.03 }}
    >
      <div className={`rounded-xl border bg-card px-4 py-3 transition-colors ${isOverdue ? "border-destructive/40" : "border-border"}`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3 min-w-0">
            <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${item.status === "COMPLETED" ? "bg-primary/10" : "bg-muted"}`}>
              <CheckSquare className={`h-4 w-4 ${item.status === "COMPLETED" ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <StatusBadge status={item.status} />
                {isOverdue && (
                  <Badge variant="destructive" className="text-xs gap-1 py-0">
                    <AlertCircle className="h-2.5 w-2.5" />
                    Overdue
                  </Badge>
                )}
              </div>
              <p className="text-sm text-foreground font-medium leading-snug">{item.task}</p>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><User className="h-3 w-3" />{item.assignee}</span>
                {dueDate && (
                  <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}>
                    <Calendar className="h-3 w-3" />{dueDate}
                  </span>
                )}
              </div>
            </div>
          </div>
          {item.status !== "COMPLETED" && (
            <Button size="sm" variant="outline" onClick={handleStatusChange} disabled={loading}
              className="shrink-0 text-xs h-7 px-2.5 border-border hover:border-primary hover:text-primary">
              {item.status === "PENDING" ? "Start" : "Complete"}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
