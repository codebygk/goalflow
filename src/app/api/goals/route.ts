import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals } from "@/lib/db/schema";
import { goalSchema } from "@/lib/validations";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userGoals = await db
    .select()
    .from(goals)
    .where(eq(goals.userId, session.user.id))
    .orderBy(desc(goals.createdAt));

  return NextResponse.json({ goals: userGoals });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });
  }

  const { title, description, status, targetDate } = parsed.data;

  const [goal] = await db
    .insert(goals)
    .values({
      userId: session.user.id,
      title,
      description,
      status,
      targetDate: targetDate ? new Date(targetDate) : null,
    })
    .returning();

  return NextResponse.json({ goal }, { status: 201 });
}
