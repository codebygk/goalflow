import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { TasksList } from "@/components/tasks/tasks-list";

export default async function LaterPage() {
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
      isNull(tasks.dueDate),
      ne(tasks.status, "cancelled"),
      ne(tasks.status, "done"),
    ));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Someday</p>
        <h1 className="font-display text-2xl md:text-3xl font-bold mt-1">Later</h1>
        <p className="text-muted-foreground mt-1">
          {allTasks.length === 0
            ? "No tasks parked for later."
            : `${allTasks.length} task${allTasks.length !== 1 ? "s" : ""} with no due date`}
        </p>
      </div>
      <TasksList initialTasks={allTasks} />
    </div>
  );
}