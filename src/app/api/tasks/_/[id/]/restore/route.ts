import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [restored] = await db.update(tasks)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(tasks.id, params.id), eq(tasks.userId, session.user.id)))
    .returning();

  if (!restored) return NextResponse.json({ error: "Task not found" }, { status: 404 });
  return NextResponse.json({ task: restored });
}
