import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { eq, and, isNull, ne } from "drizzle-orm";
import { isTaskScheduledToday } from "@/lib/repeat-utils";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch all non-deleted, non-cancelled tasks for this user
  const allTasks = await db
    .select({
      id: tasks.id,
      title: tasks.title,
      description: tasks.description,
      status: tasks.status,
      priority: tasks.priority,
      completed: tasks.completed,
      dueDate: tasks.dueDate,
      repeatInterval: tasks.repeatInterval,
      repeatDays: tasks.repeatDays,
      repeatMonthDay: tasks.repeatMonthDay,
      deletedAt: tasks.deletedAt,
      projectId: tasks.projectId,
      userId: tasks.userId,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      projectTitle: projects.title,
    })
    .from(tasks)
    .leftJoin(projects, eq(tasks.projectId, projects.id))
    .where(and(
      eq(tasks.userId, session.user.id),
      isNull(tasks.deletedAt),
      ne(tasks.status, "cancelled"),
    ));

  // Filter to tasks scheduled for today
  const todayTasks = allTasks.filter(isTaskScheduledToday);

  // Sort: incomplete first (by priority), then done
  const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
  todayTasks.sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
  });

  return NextResponse.json({ tasks: todayTasks });
}
