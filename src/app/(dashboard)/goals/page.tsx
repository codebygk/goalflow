import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { GoalsList } from "@/components/goals/goals-list";
import { CreateGoalButton } from "@/components/goals/create-goal-button";

export default async function GoalsPage() {
  const session = await auth();
  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, session!.user!.id!))
    .orderBy(desc(goals.createdAt));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground mt-1">Define what you want to achieve</p>
        </div>
        <CreateGoalButton />
      </div>
      <GoalsList initialGoals={userGoals} />
    </div>
  );
}
