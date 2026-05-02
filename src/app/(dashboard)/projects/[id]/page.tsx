import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, tasks, goals } from "@/lib/db/schema";
import { eq, and, desc, isNull } from "drizzle-orm";
import { notFound } from "next/navigation";
import { TasksList } from "@/components/tasks/tasks-list";
import { CreateTaskButton } from "@/components/tasks/create-task-button";
import { Badge } from "@/components/ui/badge";
import { cn, getStatusColor } from "@/lib/utils";
import { FolderKanban, Target } from "lucide-react";
import Link from "next/link";

export default async function ProjectDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const [project] = await db
    .select({
      id: projects.id, title: projects.title, description: projects.description,
      status: projects.status, goalId: projects.goalId, userId: projects.userId,
      createdAt: projects.createdAt, updatedAt: projects.updatedAt,
      goalTitle: goals.title,
    })
    .from(projects)
    .leftJoin(goals, eq(projects.goalId, goals.id))
    .where(and(eq(projects.id, params.id), eq(projects.userId, session!.user!.id!)))
    .limit(1);

  if (!project) notFound();

  const projectTasks = await db
    .select({
      id: tasks.id, title: tasks.title, description: tasks.description,
      status: tasks.status, priority: tasks.priority, completed: tasks.completed,
      dueDate: tasks.dueDate, repeatInterval: tasks.repeatInterval,
      repeatDays: tasks.repeatDays, repeatMonthDay: tasks.repeatMonthDay,
      deletedAt: tasks.deletedAt,
      projectId: tasks.projectId, userId: tasks.userId,
      createdAt: tasks.createdAt, updatedAt: tasks.updatedAt,
    })
    .from(tasks)
    .where(and(eq(tasks.projectId, params.id), isNull(tasks.deletedAt)))
    .orderBy(desc(tasks.createdAt));

  // Add projectTitle manually
  const tasksWithProject = projectTasks.map(t => ({ ...t, projectTitle: project.title }));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <FolderKanban className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{project.title}</h1>
              {project.description && (
                <p className="text-muted-foreground text-sm mt-0.5">{project.description}</p>
              )}
            </div>
          </div>
          <Badge className={cn("capitalize border text-xs", getStatusColor(project.status))}>
            {project.status.replace("_", " ")}
          </Badge>
        </div>
        {project.goalTitle && (
          <Link href={`/goals/${project.goalId}`}
            className="inline-flex items-center gap-1.5 mt-4 text-sm text-muted-foreground hover:text-primary transition-colors">
            <Target className="w-4 h-4" /> Goal: {project.goalTitle}
          </Link>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Tasks</h2>
          <CreateTaskButton projectId={params.id} projectTitle={project.title} />
        </div>
        <TasksList initialTasks={tasksWithProject} projectId={params.id} />
      </div>
    </div>
  );
}
