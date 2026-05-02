import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { TasksList } from "@/components/tasks/tasks-list";
import { CreateTaskButton } from "@/components/tasks/create-task-button";

export default async function TasksPage() {
  const session = await auth();

  const userTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      completed: tasks.completed,
      dueDate: tasks.dueDate,
      projectId: tasks.projectId,
      userId: tasks.userId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      projectTitle: projects.title,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(eq(tasks.userId, session!.user!.id!))
    .orderBy(desc(tasks.createdAt));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold">Tasks</h1>
          <p className="text-muted-foreground mt-1">Everything you need to get done</p>
        </div>
        <CreateTaskButton />
      </div>
      <TasksList initialTasks={userTasks} />
    </div>
  );
}
