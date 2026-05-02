import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    active: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    completed: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    archived: "bg-gray-500/15 text-gray-500 border-gray-500/30",
    on_hold: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    todo: "bg-slate-500/15 text-slate-600 border-slate-500/30",
    in_progress: "bg-violet-500/15 text-violet-600 border-violet-500/30",
    done: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    cancelled: "bg-red-500/15 text-red-500 border-red-500/30",
  };
  return colors[status] ?? "bg-gray-500/15 text-gray-500 border-gray-500/30";
}

export function getPriorityColor(priority: string): string {
  const colors: Record<string, string> = {
    low: "text-slate-500",
    medium: "text-amber-500",
    high: "text-orange-500",
    urgent: "text-red-500",
  };
  return colors[priority] ?? "text-slate-500";
}
