"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ActionItemCard } from "@/components/custom/action-item-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { CheckSquare, Search, AlertCircle } from "lucide-react";
import type { ActionItem } from "@/db/schema";

type Status = "ALL" | "PENDING" | "IN_PROGRESS" | "COMPLETED";

export default function ActionItemsPage() {
  const [items, setItems] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Status>("ALL");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("assignee", search);
    const res = await fetch(`/api/action-items?${params}`);
    const data = await res.json();
    if (data.success) setItems(data.data.actionItems as ActionItem[]);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchItems, 300);
    return () => clearTimeout(t);
  }, [fetchItems]);

  function handleStatusChange(id: string, status: "PENDING" | "IN_PROGRESS" | "COMPLETED") {
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, status } : i));
  }

  const filtered = items.filter((i) => tab === "ALL" || i.status === tab);
  const overdue = items.filter((i) => i.dueDate && new Date(i.dueDate) < new Date() && i.status !== "COMPLETED");
  const counts = {
    ALL: items.length,
    PENDING: items.filter((i) => i.status === "PENDING").length,
    IN_PROGRESS: items.filter((i) => i.status === "IN_PROGRESS").length,
    COMPLETED: items.filter((i) => i.status === "COMPLETED").length,
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Synthex &rsaquo; Action Items
      </p>

      <div>
        <h1 className="text-xl font-bold text-foreground">Action Items</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Track and manage tasks from your meetings</p>
      </div>

      {overdue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-xl p-3 text-sm text-destructive"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{overdue.length} action {overdue.length === 1 ? "item is" : "items are"} overdue</span>
        </motion.div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Filter by assignee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Status)}>
        <TabsList>
          {(["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"] as Status[]).map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {s === "IN_PROGRESS" ? "In Progress" : s === "ALL" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
              <span className="ml-1 opacity-60">({counts[s]})</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={tab} className="mt-4">
          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-10 text-center">
              <CheckSquare className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">No action items{tab !== "ALL" ? ` with status "${tab.replace("_", " ").toLowerCase()}"` : ""}.</p>
            </div>
          ) : (
            <AnimatePresence>
              <div className="space-y-2">
                {filtered.map((item, i) => (
                  <ActionItemCard key={item.id} item={item} onStatusChange={handleStatusChange} index={i} />
                ))}
              </div>
            </AnimatePresence>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
