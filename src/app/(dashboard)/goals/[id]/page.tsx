import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, projects } from "@/lib/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { notFound } from "next/navigation";
import { ProjectsList } from "@/components/projects/projects-list";
import { CreateProjectButton } from "@/components/projects/create-project-button";
import { Badge } from "@/components/ui/badge";
import { formatDate, getStatusColor } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { Target, Calendar } from "lucide-react";

export default async function GoalDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();

  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, params.id), eq(goals.userId, session!.user!.id!)))
    .limit(1);

  if (!goal) notFound();

  const goalProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.goalId, params.id))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white rounded-2xl p-4 md:p-6 border shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold">{goal.title}</h1>
              {goal.description && (
                <p className="text-muted-foreground text-sm mt-0.5">{goal.description}</p>
              )}
            </div>
          </div>
          <Badge className={cn("capitalize border text-xs", getStatusColor(goal.status))}>
            {goal.status.replace("_", " ")}
          </Badge>
        </div>
        {goal.targetDate && (
          <div className="flex items-center gap-1.5 mt-4 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            Target: {formatDate(goal.targetDate)}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-xl font-semibold">Projects</h2>
          <CreateProjectButton goalId={params.id} goalTitle={goal.title} />
        </div>
        <ProjectsList initialProjects={goalProjects} goalId={params.id} />
      </div>
    </div>
  );
}
