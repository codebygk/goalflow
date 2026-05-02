import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { CategoryList } from "@/components/categories/categoy-list";
import { CreateCategoryButton } from "@/components/categories/create-category-button";

export default async function CategoriesPage() {
  const session = await auth();
  const userCategories = await db
    .select()
    .from(categories)
    .where(eq(categories.userId, session!.user!.id!))
    .orderBy(desc(categories.createdAt));

  return (
    <div className="space-y-6 animate-fade-in">

      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground mt-1">Organise your goals with custom categories</p>
        </div>
        <CreateCategoryButton />
      </div>
      <CategoryList initialCategories={userCategories} />
    </div>
  );
}
