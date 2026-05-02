import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, projects, tasks } from "@/lib/db/schema";
import { goalSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [goal] = await db
    .select()
    .from(goals)
    .where(and(eq(goals.id, params.id), eq(goals.userId, session.user.id)))
    .limit(1);

  if (!goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const goalProjects = await db
    .select()
    .from(projects)
    .where(eq(projects.goalId, params.id));

  return NextResponse.json({ goal, projects: goalProjects });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = goalSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { title, description, status, targetDate } = parsed.data;

  const [updated] = await db
    .update(goals)
    .set({
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(status !== undefined && { status }),
      ...(targetDate !== undefined && {
        targetDate: targetDate ? new Date(targetDate) : null,
      }),
      updatedAt: new Date(),
    })
    .where(and(eq(goals.id, params.id), eq(goals.userId, session.user.id)))
    .returning();

  if (!updated) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  return NextResponse.json({ goal: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .delete(goals)
    .where(and(eq(goals.id, params.id), eq(goals.userId, session.user.id)));

  return NextResponse.json({ success: true });
}
