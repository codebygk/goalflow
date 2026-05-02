"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Goal } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDate, getStatusColor } from "@/lib/utils"
import { Target, Calendar, Pencil, Trash2 } from "lucide-react"
import { GoalDialog } from "./goal-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"

interface GoalsListProps { initialGoals: Goal[] }

export function GoalsList({ initialGoals }: GoalsListProps) {
  const [goals, setGoals] = useState(initialGoals)
  const [editTarget, setEditTarget] = useState<Goal | null>(null)
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

  if (goals.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-white">
        <Target className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No goals yet</p>
        <p className="text-sm mt-1">Create your first goal to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {goals.map(goal => (
          <div
            key={goal.id}
            onClick={() => router.push(`/goals/${goal.id}`)}
            className="bg-white border rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group"
          >
            <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 md:w-5 md:h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{goal.title}</span>
                <Badge className={cn("capitalize border text-xs", getStatusColor(goal.status))}>
                  {goal.status.replace("_", " ")}
                </Badge>
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
            {/* Action buttons - always visible on mobile, hover on desktop */}
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

      {editTarget && (
        <GoalDialog
          open={!!editTarget}
          onOpenChange={open => { if (!open) setEditTarget(null) }}
          goal={editTarget}
          onSave={updated => {
            setGoals(prev => prev.map(g => g.id === updated.id ? updated : g))
            setEditTarget(null)
          }}
        />
      )}
    </>
  )
}
