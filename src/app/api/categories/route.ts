import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { categorySchema } from "@/lib/validations";
import { eq, and, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, session.user.id))
    .orderBy(desc(categories.createdAt));

  return NextResponse.json({ categories: userCategories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = categorySchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 });

  const [category] = await db
    .insert(categories)
    .values({ userId: session.user.id, ...parsed.data })
    .returning();

  return NextResponse.json({ category }, { status: 201 });
}
