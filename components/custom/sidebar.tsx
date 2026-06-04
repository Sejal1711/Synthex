"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Crown,
  LayoutDashboard,
  Calendar,
  CheckSquare,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "./theme-toggle";
import { useState } from "react";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "Workspace",
    items: [
      { href: "/meetings", label: "Meetings", icon: Calendar },
      { href: "/action-items", label: "Action Items", icon: CheckSquare },
      { href: "/action-items/overdue-view", label: "Overdue", icon: AlertCircle },
    ],
  },
];

interface SidebarProps {
  userName?: string;
  userEmail?: string;
}

export function Sidebar({ userName = "User", userEmail = "" }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col h-screen border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--sidebar))] shrink-0 overflow-hidden"
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-[hsl(var(--sidebar-border))]">
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2 min-w-0"
            >
              <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <Crown className="h-4 w-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground leading-tight truncate">Synthex</p>
                <p className="text-[10px] text-muted-foreground truncate">Meeting Intelligence</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {collapsed && (
          <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center mx-auto">
            <Crown className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
        {!collapsed && (
          <button
            onClick={() => setCollapsed(true)}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <PanelLeftClose className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mt-2 mx-auto text-muted-foreground hover:text-foreground transition-colors p-1"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => {
                const active = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    title={collapsed ? label : undefined}
                    className={cn(
                      "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm font-medium transition-colors",
                      active
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:bg-[hsl(var(--sidebar-accent))] hover:text-foreground",
                      collapsed && "justify-center px-0"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[hsl(var(--sidebar-border))] p-2 space-y-1">
        <div className={cn("flex items-center gap-2 px-2 py-1.5", collapsed && "justify-center px-0")}>
          <ThemeToggle />
          {!collapsed && <span className="text-xs text-muted-foreground">Theme</span>}
        </div>

        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full",
            collapsed && "justify-center px-0"
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
            <div className="h-7 w-7 rounded-full bg-primary flex items-center justify-center text-[11px] font-bold text-primary-foreground shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{userName}</p>
              <p className="text-[10px] text-muted-foreground truncate">{userEmail}</p>
            </div>
          </div>
        )}
      </div>
    </motion.aside>
  );
}
