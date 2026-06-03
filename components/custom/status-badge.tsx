import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  className?: string;
}

const cfg = {
  PENDING: "bg-muted text-muted-foreground border-border",
  IN_PROGRESS: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  COMPLETED: "bg-primary/10 text-primary border-primary/20",
};

const labels = { PENDING: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed" };

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
      cfg[status], className
    )}>
      {labels[status]}
    </span>
  );
}
