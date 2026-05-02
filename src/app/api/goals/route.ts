import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { goals, categories } from "@/lib/db/schema";
import { goalSchema } from "@/lib/validations";
import { eq, and, desc, asc, ilike, or } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortDir = searchParams.get("sortDir") || "desc";

  const orderCol = sortBy === "title" ? goals.title
    : sortBy === "targetDate" ? goals.targetDate
    : sortBy === "status" ? goals.status
    : goals.createdAt;

  const orderFn = sortDir === "asc" ? asc : desc;

  let conditions = [eq(goals.userId, session.user.id)];
  if (status) conditions.push(eq(goals.status, status as any));
  if (categoryId) conditions.push(eq(goals.categoryId, categoryId));

  let query = db
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
    .where(and(...conditions))
    .orderBy(orderFn(orderCol));

  const userGoals = await query;

  const filtered = search
    ? userGoals.filter(g =>
        g.title.toLowerCase().includes(search.toLowerCase()) ||
        (g.description ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : userGoals;

  return NextResponse.json({ goals: filtered });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = goalSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const { title, description, status, targetDate, categoryId } = parsed.data;
  const [goal] = await db
    .insert(goals)
    .values({
      userId: session.user.id,
      title,
      description,
      status,
      targetDate: targetDate ? new Date(targetDate) : null,
      categoryId: categoryId || null,
    })
    .returning();

  return NextResponse.json({ goal }, { status: 201 });
}
