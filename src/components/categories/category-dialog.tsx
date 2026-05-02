"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { categorySchema, type CategoryInput } from "@/lib/validations"
import { Category } from "@/lib/db/schema"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const PRESET_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6",
  "#0ea5e9", "#6b7280",
]

const PRESET_ICONS = [
  "Target", "Heart", "DollarSign", "Dumbbell", "BookOpen",
  "Briefcase", "Home", "Users", "Star", "Zap",
  "Globe", "Music", "Camera", "Code", "Leaf",
]

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: Category
  onSave?: (category: Category) => void
}

export function CategoryDialog({ open, onOpenChange, category, onSave }: CategoryDialogProps) {
  const router = useRouter()
  const isEdit = !!category

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: category?.name ?? "",
      color: category?.color ?? "#6366f1",
      icon: category?.icon ?? "Target",
    },
  })

  const selectedColor = watch("color")
  const selectedIcon = watch("icon")

  const onSubmit = async (data: CategoryInput) => {
    const url = isEdit ? `/api/categories/${category.id}` : "/api/categories"
    const method = isEdit ? "PATCH" : "POST"
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" })
      return
    }
    const json = await res.json()
    toast({ title: isEdit ? "Category updated" : "Category created" })
    onSave?.(json.category)
    onOpenChange(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Name</Label>
            <Input placeholder="e.g. Financial Goals" {...register("name")} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Color</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map(color => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setValue("color", color)}
                  className="w-7 h-7 rounded-full border-2 transition-all"
                  style={{
                    backgroundColor: color,
                    borderColor: selectedColor === color ? "#000" : "transparent",
                    transform: selectedColor === color ? "scale(1.2)" : "scale(1)",
                  }}
                />
              ))}
            </div>
            <Input type="color" {...register("color")} className="h-8 w-20 cursor-pointer" />
          </div>
          <div className="space-y-1.5">
            <Label>Icon</Label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_ICONS.map(icon => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setValue("icon", icon)}
                  className="px-2 py-1 text-xs rounded border transition-all"
                  style={{
                    backgroundColor: selectedIcon === icon ? selectedColor : "transparent",
                    color: selectedIcon === icon ? "#fff" : undefined,
                    borderColor: selectedIcon === icon ? selectedColor : undefined,
                  }}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
