import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks, projects } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";
import { eq, and, desc, isNull, isNotNull } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const inbox = searchParams.get("inbox") === "true";
  const showDeleted = searchParams.get("deleted") === "true";

  const conditions: any[] = [
    eq(tasks.userId, session.user.id),
    showDeleted ? isNotNull(tasks.deletedAt) : isNull(tasks.deletedAt),
  ];

  if (inbox) {
    conditions.push(isNull(tasks.projectId));
  } else if (projectId) {
    conditions.push(eq(tasks.projectId, projectId));
  }

  const rows = await db
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
    .where(and(...conditions))
    .orderBy(desc(tasks.createdAt));

  return NextResponse.json({ tasks: rows });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { title, description, projectId, status, priority, dueDate, repeatInterval, repeatDays, repeatMonthDay } = parsed.data;

  if (projectId) {
    const [project] = await db.select().from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, session.user.id))).limit(1);
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const [task] = await db.insert(tasks).values({
    userId: session.user.id,
    projectId: projectId ?? null,
    title,
    description,
    status,
    priority,
    repeatInterval,
    repeatDays: repeatDays ?? null,
    repeatMonthDay: repeatMonthDay ?? null,
    dueDate: dueDate ? new Date(dueDate) : null,
  }).returning();

  return NextResponse.json({ task }, { status: 201 });
}