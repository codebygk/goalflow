import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, desc, isNotNull, and } from "drizzle-orm";
import { TrashList } from "@/components/trash/trash-list";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function TrashPage() {
  const session = await auth();

  const deletedTasks = await db
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
    .where(and(eq(tasks.userId, session!.user!.id!), isNotNull(tasks.deletedAt)))
    .orderBy(desc(tasks.deletedAt));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link href="/tasks" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Tasks
        </Link>
      </div>
      <div>
        <h1 className="font-display text-3xl font-bold">Trash</h1>
        <p className="text-muted-foreground mt-1">
          {deletedTasks.length === 0 ? "No deleted tasks" : `${deletedTasks.length} deleted task${deletedTasks.length !== 1 ? "s" : ""}`}
        </p>
      </div>
      <TrashList initialTasks={deletedTasks} />
    </div>
  );
}