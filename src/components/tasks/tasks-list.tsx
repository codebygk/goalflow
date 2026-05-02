"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDate, getStatusColor, getPriorityColor } from "@/lib/utils"
import { CheckSquare, Pencil, Trash2, Calendar, FolderKanban, Flag } from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Task } from "@/lib/db/schema"

type TaskWithProject = Task & { projectTitle?: string | null }

interface TasksListProps {
  initialTasks: TaskWithProject[]
  projectId?: string
}

export function TasksList({ initialTasks, projectId }: TasksListProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [editTarget, setEditTarget] = useState<TaskWithProject | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (res.ok) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      toast({ title: "Task deleted" })
      router.refresh()
    }
  }

  const toggleDone = async (task: TaskWithProject) => {
    const newStatus = task.status === "done" ? "todo" : "done"
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const json = await res.json()
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...json.task, projectTitle: t.projectTitle } : t))
    }
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-white">
        <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No tasks yet</p>
        <p className="text-sm mt-1">Break your project into actionable tasks</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-2">
        {tasks.map((task) => (
          <div key={task.id} className={cn("bg-white border rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-shadow group", task.status === "done" && "opacity-60")}>
            {/* Checkbox */}
            <button
              onClick={() => toggleDone(task)}
              className={cn(
                "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
                task.status === "done" ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground hover:border-primary"
              )}
            >
              {task.status === "done" && <span className="text-white text-xs font-bold">✓</span>}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn("font-medium text-sm", task.status === "done" && "line-through text-muted-foreground")}>
                  {task.title}
                </span>
                <Badge className={cn("capitalize border text-xs", getStatusColor(task.status))}>
                  {task.status.replace("_", " ")}
                </Badge>
              </div>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
              )}
              <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                <span className={cn("flex items-center gap-1 text-xs font-medium", getPriorityColor(task.priority))}>
                  <Flag className="w-3 h-3" /> {task.priority}
                </span>
                {task.dueDate && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" /> {formatDate(task.dueDate)}
                  </span>
                )}
                {task.projectTitle && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FolderKanban className="w-3 h-3" /> {task.projectTitle}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
              <Button variant="ghost" size="icon" onClick={() => setEditTarget(task)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <DeleteConfirm onConfirm={() => handleDelete(task.id)}>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </DeleteConfirm>
            </div>
          </div>
        ))}
      </div>

      {editTarget && (
        <TaskDialog
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null) }}
          task={editTarget}
          projectId={projectId}
          onSave={(updated) => {
            setTasks((prev) => prev.map((t) => t.id === updated.id ? { ...updated, projectTitle: editTarget.projectTitle } : t))
            setEditTarget(null)
          }}
        />
      )}
    </>
  )
}
