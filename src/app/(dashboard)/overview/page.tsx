import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, projects, tasks, categories } from "@/lib/db/schema";
import { eq, and, isNull, gte, lte, isNotNull } from "drizzle-orm";
import { OverviewClient } from "@/components/overview/overview-client";

function startOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek(date: Date): Date {
  const d = startOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}

export default async function OverviewPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const now = new Date();

  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [allGoals, allProjects, allTasks, userCategories] = await Promise.all([
    db.select({
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
    })
      .from(goals)
      .leftJoin(categories, eq(goals.categoryId, categories.id))
      .where(eq(goals.userId, userId)),
    db.select().from(projects).where(eq(projects.userId, userId)),
    db.select().from(tasks).where(and(eq(tasks.userId, userId), isNull(tasks.deletedAt))),
    db.select().from(categories).where(eq(categories.userId, userId)),
  ]);

  const weekTasks = allTasks.filter(t => t.dueDate && t.dueDate >= weekStart && t.dueDate <= weekEnd);
  const monthTasks = allTasks.filter(t => t.dueDate && t.dueDate >= monthStart && t.dueDate <= monthEnd);
  const weekCompletedTasks = weekTasks.filter(t => t.completed);
  const monthCompletedTasks = monthTasks.filter(t => t.completed);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl md:text-3xl font-bold">Overview</h1>
        <p className="text-muted-foreground mt-1">Weekly and monthly progress at a glance</p>
      </div>
      <OverviewClient
        allGoals={allGoals as any}
        allProjects={allProjects}
        allTasks={allTasks}
        weekTasks={weekTasks}
        monthTasks={monthTasks}
        weekCompletedTasks={weekCompletedTasks}
        monthCompletedTasks={monthCompletedTasks}
        categories={userCategories}
        weekRange={{ start: weekStart.toISOString(), end: weekEnd.toISOString() }}
        monthRange={{ start: monthStart.toISOString(), end: monthEnd.toISOString() }}
        now={now.toISOString()}
      />
    </div>
  );
}
