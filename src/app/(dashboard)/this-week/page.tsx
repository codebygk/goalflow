import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { TasksList } from "@/components/tasks/tasks-list";

export default async function ThisWeekPage() {
  const session = await auth();

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // "This week" = today through end of Sunday (next Sunday midnight)
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (7 - today.getDay())); // next Sunday

  const allTasks = await db
    .select({
      id: tasks.id, title: tasks.title, description: tasks.description,
      status: tasks.status, priority: tasks.priority, completed: tasks.completed,
      dueDate: tasks.dueDate, repeatInterval: tasks.repeatInterval,
      repeatDays: tasks.repeatDays, repeatMonthDay: tasks.repeatMonthDay,
      deletedAt: tasks.deletedAt,
      projectId: tasks.projectId, userId: tasks.userId,
      createdAt: tasks.createdAt, updatedAt: tasks.updatedAt,
      projectTitle: projects.title,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(
      eq(tasks.userId, session!.user!.id!),
      isNull(tasks.deletedAt),
      ne(tasks.status, "cancelled"),
    ));

  const weekTasks = allTasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    d.setHours(0, 0, 0, 0);
    return d >= today && d <= endOfWeek;
  });

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
  weekTasks.sort((a, b) => {
    const da = a.dueDate ? new Date(a.dueDate).getTime() : 0;
    const db2 = b.dueDate ? new Date(b.dueDate).getTime() : 0;
    if (da !== db2) return da - db2;
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
  });

  const weekStart = today.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const weekEnd = endOfWeek.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{weekStart} – {weekEnd}</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">This Week</h1>
        <p className="text-muted-foreground mt-1">
          {weekTasks.length === 0
            ? "Nothing scheduled this week."
            : `${weekTasks.filter(t => t.status !== "done").length} task${weekTasks.filter(t => t.status !== "done").length !== 1 ? "s" : ""} this week`}
        </p>
      </div>
      <TasksList initialTasks={weekTasks} />
    </div>
  );
}