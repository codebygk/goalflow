import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { goalSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const [goal] = await db.select().from(goals).where(and(eq(goals.id, params.id), eq(goals.userId, session.user.id)));
  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ goal });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { title, description, status, targetDate, categoryId } = parsed.data;
  const [goal] = await db
    .update(goals)
    .set({ title, description, status, targetDate: targetDate ? new Date(targetDate) : null, categoryId: categoryId || null, updatedAt: new Date() })
    .where(and(eq(goals.id, params.id), eq(goals.userId, session.user.id)))
    .returning();

  if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ goal });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await db.delete(goals).where(and(eq(goals.id, params.id), eq(goals.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
