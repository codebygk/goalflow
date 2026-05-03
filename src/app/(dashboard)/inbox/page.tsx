import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and, isNull, desc } from "drizzle-orm";
import { TasksList } from "@/components/tasks/tasks-list";

export default async function InboxPage() {
  const session = await auth();

  const inboxTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      completed: tasks.completed,
      dueDate: tasks.dueDate,
      repeatInterval: tasks.repeatInterval,
      repeatDays: tasks.repeatDays,
      repeatMonthDay: tasks.repeatMonthDay,
      deletedAt: tasks.deletedAt,
      projectId: tasks.projectId,
      userId: tasks.userId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(and(
      eq(tasks.userId, session!.user!.id!),
      isNull(tasks.projectId),
      isNull(tasks.deletedAt),
    ))
    .orderBy(desc(tasks.createdAt));

  const inboxTasksWithProject = inboxTasks.map(t => ({ ...t, projectTitle: null }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Inbox</h1>
          <p className="text-muted-foreground mt-1">
            {inboxTasks.length === 0
              ? "Quick capture - tasks not assigned to any project"
              : `${inboxTasks.filter(t => t.status !== "done").length} unassigned task${inboxTasks.filter(t => t.status !== "done").length !== 1 ? "s" : ""}`}
          </p>
        </div>
      </div>
      <TasksList initialTasks={inboxTasksWithProject} />
    </div>
  );
}