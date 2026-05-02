import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { taskSchema } from "@/lib/validations";
import { eq, and } from "drizzle-orm";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = taskSchema.partial().safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const data = parsed.data;
  const updateData: Record<string, unknown> = { ...data, updatedAt: new Date() };

  if (data.dueDate !== undefined) updateData.dueDate = data.dueDate ? new Date(data.dueDate) : null;
  if (data.repeatDays !== undefined) updateData.repeatDays = data.repeatDays ?? null;
  if (data.repeatMonthDay !== undefined) updateData.repeatMonthDay = data.repeatMonthDay ?? null;
  if (data.status) updateData.completed = (data.status as string) === "done";

  const [updated] = await db.update(tasks).set(updateData)
    .where(and(eq(tasks.id, params.id), eq(tasks.userId, session.user.id))).returning();

  if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ task: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [updated] = await db.update(tasks)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(tasks.id, params.id), eq(tasks.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ success: true });
}
