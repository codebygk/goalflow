import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { TasksList } from "@/components/tasks/tasks-list";

export default async function TomorrowPage() {
  const session = await auth();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

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

  const tomorrowTasks = allTasks.filter(t => {
    if (!t.dueDate) return false;
    const d = new Date(t.dueDate);
    return d >= tomorrow && d < dayAfter;
  });

  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
  tomorrowTasks.sort((a, b) => (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2));

  const dateLabel = tomorrow.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">{dateLabel}</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">Tomorrow</h1>
        <p className="text-muted-foreground mt-1">
          {tomorrowTasks.length === 0
            ? "Nothing scheduled for tomorrow yet."
            : `${tomorrowTasks.filter(t => t.status !== "done").length} task${tomorrowTasks.filter(t => t.status !== "done").length !== 1 ? "s" : ""} ahead`}
        </p>
      </div>
      <TasksList initialTasks={tomorrowTasks} />
    </div>
  );
}