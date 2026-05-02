import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, projects, tasks } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { GoalsList } from "@/components/goals/goals-list";
import { StatsCard } from "@/components/dashboard/stats-card";
import { Target, FolderKanban, CheckSquare, TrendingUp } from "lucide-react";

async function getDashboardData(userId: string) {
  const [goalCount] = await db.select({ count: count() }).from(goals).where(eq(goals.userId, userId));
  const [projectCount] = await db.select({ count: count() }).from(projects).where(eq(projects.userId, userId));
  const [taskCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.userId, userId));
  const [doneCount] = await db.select({ count: count() }).from(tasks).where(eq(tasks.userId, userId));

  const userGoals = await db.select().from(goals).where(eq(goals.userId, userId)).limit(5);

  return {
    goalCount: goalCount.count,
    projectCount: projectCount.count,
    taskCount: taskCount.count,
    doneCount: doneCount.count,
    goals: userGoals,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const data = await getDashboardData(session!.user!.id!);

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          Good to see you, {session?.user?.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">Here's your progress at a glance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Goals" value={data.goalCount} icon={Target} color="orange" />
        <StatsCard title="Projects" value={data.projectCount} icon={FolderKanban} color="violet" />
        <StatsCard title="Tasks" value={data.taskCount} icon={CheckSquare} color="blue" />
        <StatsCard title="Completed" value={data.doneCount} icon={TrendingUp} color="green" />
      </div>

      <div>
        <h2 className="font-display text-xl font-semibold mb-4">Your Goals</h2>
        <GoalsList initialGoals={data.goals} />
      </div>
    </div>
  );
}
