import { Task } from "@/lib/db/schema";

/**
 * Returns true if a repeating task should appear in "My Day" today.
 */
export function isTaskScheduledToday(task: Pick<Task, "repeatInterval" | "repeatDays" | "repeatMonthDay" | "dueDate">): boolean {
  const today = new Date();
  const dow = today.getDay();      // 0=Sun … 6=Sat
  const dom = today.getDate();     // 1-31

  switch (task.repeatInterval) {
    case "none":
      // Non-repeating: show if due today
      if (!task.dueDate) return false;
      const due = new Date(task.dueDate);
      return (
        due.getFullYear() === today.getFullYear() &&
        due.getMonth() === today.getMonth() &&
        due.getDate() === today.getDate()
      );

    case "daily":
      return true;

    case "weekly":
    case "biweekly": {
      if (!task.repeatDays) return false;
      const days = task.repeatDays.split(",").map(Number);
      if (!days.includes(dow)) return false;
      if (task.repeatInterval === "weekly") return true;
      // biweekly: only on even/odd ISO weeks
      const startOfYear = new Date(today.getFullYear(), 0, 1);
      const weekNo = Math.ceil(((today.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
      return weekNo % 2 === 0;
    }

    case "monthly":
      return task.repeatMonthDay === dom;

    default:
      return false;
  }
}

/** Human-readable repeat summary */
export function repeatLabel(task: Pick<Task, "repeatInterval" | "repeatDays" | "repeatMonthDay">): string {
  const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  switch (task.repeatInterval) {
    case "none": return "";
    case "daily": return "Every day";
    case "weekly":
    case "biweekly": {
      const prefix = task.repeatInterval === "biweekly" ? "Every 2 weeks" : "Weekly";
      if (!task.repeatDays) return prefix;
      const names = task.repeatDays.split(",").map(Number).map(d => DAY_NAMES[d]).join(", ");
      return `${prefix} on ${names}`;
    }
    case "monthly":
      return task.repeatMonthDay ? `Monthly on the ${ordinal(task.repeatMonthDay)}` : "Monthly";
    default: return "";
  }
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}
