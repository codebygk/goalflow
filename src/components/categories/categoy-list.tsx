"use client"

import { useState } from "react"
import { Category } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CategoryDialog } from "./category-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Plus, Pencil, Trash2, Tag } from "lucide-react"

interface CategoryListProps {
  initialCategories: Category[]
}

export function CategoryList({ initialCategories }: CategoryListProps) {
  const [categories, setCategories] = useState(initialCategories)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<Category | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" })
    if (res.ok) {
      setCategories(prev => prev.filter(c => c.id !== id))
      toast({ title: "Category deleted" })
      router.refresh()
    }
  }

  return (
    <div className="space-y-4">
      {categories.length === 0 ? (
        <div className="text-center py-12 border rounded-2xl bg-white text-muted-foreground">
          <Tag className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="font-medium">No categories yet</p>
          <p className="text-sm">Create categories like Financial, Health, Relationships…</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white border rounded-2xl p-4 flex items-center gap-3 group shadow-sm hover:shadow-md transition-all">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-sm"
                style={{ backgroundColor: cat.color }}
              >
                {cat.name[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{cat.name}</p>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cat.color }} />
                  <span className="text-xs text-muted-foreground">{cat.icon}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditTarget(cat); setDialogOpen(true) }}>
                  <Pencil className="w-3 h-3" />
                </Button>
                <DeleteConfirm onConfirm={() => handleDelete(cat.id)}>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </DeleteConfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      <CategoryDialog
        open={dialogOpen}
        onOpenChange={open => { setDialogOpen(open); if (!open) setEditTarget(null) }}
        category={editTarget ?? undefined}
        onSave={saved => {
          if (editTarget) {
            setCategories(prev => prev.map(c => c.id === saved.id ? saved : c))
          } else {
            setCategories(prev => [saved, ...prev])
          }
          setEditTarget(null)
        }}
      />
    </div>
  )
}
