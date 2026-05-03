import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, desc, isNull } from "drizzle-orm";
import { TasksList } from "@/components/tasks/tasks-list";
import Link from "next/link";
import { Trash2 } from "lucide-react";

export default async function TasksPage() {
  const session = await auth();

  const userTasks = await db
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
    .where(eq(tasks.userId, session!.user!.id!))
    .orderBy(desc(tasks.createdAt));

  // Only non-deleted tasks
  const activeTasks = userTasks.filter(t => !t.deletedAt);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Everything you need to get done</p>
        </div>
      </div>
      <TasksList initialTasks={activeTasks} />
    </div>
  );
}
