import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { isTaskScheduledToday } from "@/lib/repeat-utils";
import { TodayClient } from "@/components/tasks/today-client";

export default async function TodayPage() {
  const session = await auth();

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

  const todayTasks = allTasks.filter(isTaskScheduledToday);

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
  todayTasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
  });

  const today = new Date();
  const dateLabel = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{dateLabel}</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">Today</h1>
        <p className="text-muted-foreground mt-1">
          {todayTasks.length === 0
            ? "Nothing scheduled for today - enjoy the day!"
            : `${todayTasks.filter(t => !t.completed).length} task${todayTasks.filter(t => !t.completed).length !== 1 ? "s" : ""} remaining`}
        </p>
      </div>
      <TodayClient initialTasks={todayTasks} />
    </div>
  );
}
