"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, formatDate, getStatusColor } from "@/lib/utils"
import { Target, Calendar, Pencil, Trash2, Search, ArrowUpDown, Tag } from "lucide-react"
import { GoalDialog } from "./goal-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { Goal, Category } from "@/lib/db/schema"

type GoalWithCategory = Goal & {
  categoryName?: string | null
  categoryColor?: string | null
  categoryIcon?: string | null
}

interface GoalsListProps {
  initialGoals: GoalWithCategory[]
  categories?: Category[]
}

export function GoalsList({ initialGoals, categories = [] }: GoalsListProps) {
  const [goals, setGoals] = useState(initialGoals)
  const [editTarget, setEditTarget] = useState<GoalWithCategory | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const router = useRouter()

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await fetch(`/api/goals/${id}`, { method: "DELETE" })
    if (res.ok) {
      setGoals(prev => prev.filter(g => g.id !== id))
      toast({ title: "Goal deleted" })
      router.refresh()
    }
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(field); setSortDir("desc") }
  }

  const filtered = goals
    .filter(g => {
      if (search && !g.title.toLowerCase().includes(search.toLowerCase()) &&
          !(g.description ?? "").toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && g.status !== statusFilter) return false
      if (categoryFilter !== "all") {
        if (categoryFilter === "none") { if (g.categoryId) return false }
        else if (g.categoryId !== categoryFilter) return false
      }
      return true
    })
    .sort((a, b) => {
      let va: any, vb: any
      if (sortBy === "title") { va = a.title; vb = b.title }
      else if (sortBy === "targetDate") { va = a.targetDate?.getTime() ?? 0; vb = b.targetDate?.getTime() ?? 0 }
      else if (sortBy === "status") { va = a.status; vb = b.status }
      else { va = a.createdAt.getTime(); vb = b.createdAt.getTime() }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })

  return (
    <>
      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search goals…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_hold">On Hold</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="archived">Archived</SelectItem>
          </SelectContent>
        </Select>
        {categories.length > 0 && (
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-44"><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              <SelectItem value="none">Uncategorised</SelectItem>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  <span className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <div className="flex gap-1">
          {[
            { key: "createdAt", label: "Date" },
            { key: "title", label: "A–Z" },
            { key: "status", label: "Status" },
            { key: "targetDate", label: "Due" },
          ].map(s => (
            <Button
              key={s.key}
              variant={sortBy === s.key ? "default" : "outline"}
              size="sm"
              onClick={() => toggleSort(s.key)}
              className="gap-1 text-xs px-2"
            >
              {s.label}
              {sortBy === s.key && <ArrowUpDown className="w-3 h-3" />}
            </Button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-white">
          <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{goals.length === 0 ? "No goals yet" : "No goals match your filters"}</p>
          <p className="text-sm mt-1">{goals.length === 0 ? "Create your first goal to get started" : "Try adjusting your search or filters"}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(goal => (
            <div
              key={goal.id}
              onClick={() => router.push(`/goals/${goal.id}`)}
              className="bg-white border rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group"
            >
              <div
                className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center shrink-0"
                style={goal.categoryColor ? { backgroundColor: goal.categoryColor + "20" } : { backgroundColor: "hsl(var(--primary)/0.1)" }}
              >
                <Target
                  className="w-4 h-4 md:w-5 md:h-5"
                  style={goal.categoryColor ? { color: goal.categoryColor } : { color: "hsl(var(--primary))" }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm">{goal.title}</span>
                  <Badge className={cn("capitalize border text-xs", getStatusColor(goal.status))}>
                    {goal.status.replace("_", " ")}
                  </Badge>
                  {goal.categoryName && (
                    <span
                      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ backgroundColor: (goal.categoryColor ?? "#6366f1") + "20", color: goal.categoryColor ?? "#6366f1" }}
                    >
                      <Tag className="w-2.5 h-2.5" /> {goal.categoryName}
                    </span>
                  )}
                </div>
                {goal.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{goal.description}</p>
                )}
                {goal.targetDate && (
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {formatDate(goal.targetDate)}
                  </p>
                )}
              </div>
              <div
                className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setEditTarget(goal) }}>
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <DeleteConfirm onConfirm={() => handleDelete(goal.id, {} as React.MouseEvent)}>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </DeleteConfirm>
              </div>
            </div>
          ))}
        </div>
      )}

      {editTarget && (
        <GoalDialog
          open={!!editTarget}
          onOpenChange={open => { if (!open) setEditTarget(null) }}
          goal={editTarget}
          onSave={updated => {
            setGoals(prev => prev.map(g => g.id === updated.id ? { ...updated, categoryName: editTarget.categoryName, categoryColor: editTarget.categoryColor } : g))
            setEditTarget(null)
          }}
        />
      )}
    </>
  )
}
