import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, goals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { ProjectsList } from "@/components/projects/projects-list";
import { CreateProjectButton } from "@/components/projects/create-project-button";

export default async function ProjectsPage() {
  const session = await auth();

  const userProjects = await db
    .select({
      id: projects.id,
      title: projects.title,
      description: projects.description,
      status: projects.status,
      goalId: projects.goalId,
      userId: projects.userId,
      createdAt: projects.createdAt,
      updatedAt: projects.updatedAt,
      goalTitle: goals.title,
    })
    .from(projects)
    .leftJoin(goals, eq(projects.goalId, goals.id))
    .where(eq(projects.userId, session!.user!.id!))
    .orderBy(desc(projects.createdAt));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground mt-1">Organize your work into projects</p>
        </div>
        <CreateProjectButton />
      </div>
      <ProjectsList initialProjects={userProjects} />
    </div>
  );
}
