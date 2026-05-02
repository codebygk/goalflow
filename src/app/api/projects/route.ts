import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { projects, goals } from "@/lib/db/schema";
import { projectSchema } from "@/lib/validations";
import { eq, and, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const goalId = searchParams.get("goalId");

  const conditions = [eq(projects.userId, session.user.id)];
  if (goalId) conditions.push(eq(projects.goalId, goalId));

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
    .where(and(...conditions))
    .orderBy(desc(projects.createdAt));

  return NextResponse.json({ projects: userProjects });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { title, description, goalId, status } = parsed.data;

  // Verify goal belongs to user
  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, goalId), eq(goals.userId, session.user.id)))
    .limit(1);

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const [project] = await db
    .insert(projects)
    .values({ userId: session.user.id, goalId, title, description, status })
    .returning();

  return NextResponse.json({ project }, { status: 201 });
}
