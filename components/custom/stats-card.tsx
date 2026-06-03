"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
  variant?: "default" | "warning" | "destructive";
  index?: number;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  variant = "default",
  index = 0,
}: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.1 }}
    >
      <Card className="border-slate-800 bg-slate-800/50">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400">{title}</p>
              <p
                className={cn(
                  "text-3xl font-bold mt-1",
                  variant === "destructive" && "text-red-400",
                  variant === "warning" && "text-yellow-400",
                  variant === "default" && "text-white"
                )}
              >
                {value}
              </p>
              {description && (
                <p className="text-xs text-slate-500 mt-1">{description}</p>
              )}
            </div>
            <div
              className={cn(
                "p-3 rounded-lg",
                variant === "destructive" && "bg-red-900/30 text-red-400",
                variant === "warning" && "bg-yellow-900/30 text-yellow-400",
                variant === "default" && "bg-blue-900/30 text-blue-400"
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
