import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { GoalsList } from "@/components/goals/goals-list";

export default async function GoalsPage() {
  const session = await auth();
  const userId = session!.user!.id!;

  const userGoals = await db
    .select({
      id: goals.id,
      userId: goals.userId,
      categoryId: goals.categoryId,
      title: goals.title,
      description: goals.description,
      status: goals.status,
      targetDate: goals.targetDate,
      createdAt: goals.createdAt,
      updatedAt: goals.updatedAt,
      categoryName: categories.name,
      categoryColor: categories.color,
      categoryIcon: categories.icon,
    })
    .from(goals)
    .leftJoin(categories, eq(goals.categoryId, categories.id))
    .where(eq(goals.userId, userId))
    .orderBy(desc(goals.createdAt));

  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, userId))
    .orderBy(desc(categories.createdAt));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Goals</h1>
          <p className="text-muted-foreground mt-1">Define what you want to achieve</p>
        </div>
      </div>
      <GoalsList initialGoals={userGoals as any} categories={userCategories} />
    </div>
  );
}
