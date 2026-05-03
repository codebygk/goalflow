"use client"

import { useState } from "react"
import { TaskWithProject } from "./tasks-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, getPriorityColor, formatDate, getStatusColor } from "@/lib/utils"
import { repeatLabel } from "@/lib/repeat-utils"
import { Flag, Calendar, FolderKanban, RefreshCw, ChevronDown, ChevronUp, Sun } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

import { nextRepeatDate } from "@/lib/repeat-utils"



interface Props { initialTasks: TaskWithProject[] }

export function TodayClient({ initialTasks }: Props) {
  const [tasks, setTasks] = useState(initialTasks)
  const [completedOpen, setCompletedOpen] = useState(false)
  const router = useRouter()

  const toggleDone = async (task: TaskWithProject) => {
    const isRecurring = task.repeatInterval !== "none"
    if (isRecurring && task.status !== "done") {
      // Advance to next occurrence rather than marking done
      const next = nextRepeatDate(task)
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: next ? next.toISOString() : null, status: "todo" }),
      })
      if (res.ok) {
        // Remove from today's list since it's been advanced
        setTasks(prev => prev.filter(t => t.id !== task.id))
        toast({ title: "Done! Next instance scheduled ↻" })
        router.refresh()
      }
      return
    }
    const newStatus = task.status === "done" ? "todo" : "done"
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      const json = await res.json()
      setTasks(prev => prev.map(t => t.id === task.id ? { ...json.task, projectTitle: t.projectTitle } : t))
      if (newStatus === "done") toast({ title: "Task completed! 🎉" })
      router.refresh()
    }
  }

  const active = tasks.filter(t => t.status !== "done")
  const done = tasks.filter(t => t.status === "done")
  const totalCount = tasks.length
  const doneCount = done.length
  const progress = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100)

  if (tasks.length === 0) {
    return (
      <div className="text-center py-20 text-muted-foreground border rounded-2xl bg-white">
        <Sun className="w-12 h-12 mx-auto mb-4 text-amber-400" />
        <p className="font-display text-xl font-semibold text-foreground">All clear!</p>
        <p className="text-sm mt-2">No tasks scheduled for today.</p>
        <p className="text-sm">Tasks with today's due date or matching repeat rules appear here.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white border rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="font-medium">{doneCount} of {totalCount} completed</span>
          <span className="font-bold text-primary">{progress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Active tasks */}
      <div className="space-y-2">
        {active.map(task => (
          <TodayTaskRow key={task.id} task={task} onToggle={toggleDone} />
        ))}
      </div>

      {/* Completed accordion */}
      {done.length > 0 && (
        <div>
          <button
            onClick={() => setCompletedOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-muted-foreground font-medium hover:text-foreground transition-colors px-1 py-2 w-full"
          >
            {completedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Completed ({done.length})
          </button>
          {completedOpen && (
            <div className="space-y-2 mt-2">
              {done.map(task => (
                <TodayTaskRow key={task.id} task={task} onToggle={toggleDone} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TodayTaskRow({ task, onToggle }: { task: TaskWithProject; onToggle: (t: TaskWithProject) => void }) {
  const repeat = repeatLabel(task)
  const isDone = task.status === "done"

  return (
    <div className={cn(
      "bg-white border rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all",
      isDone && "opacity-60"
    )}>
      <button
        onClick={() => onToggle(task)}
        className={cn(
          "mt-0.5 w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
          isDone
            ? "bg-emerald-500 border-emerald-500 scale-110"
            : "border-muted-foreground hover:border-primary hover:scale-110"
        )}
      >
        {isDone && <span className="text-white text-xs font-bold">✓</span>}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("font-medium text-sm", isDone && "line-through text-muted-foreground")}>
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
          {repeat && (
            <span className="flex items-center gap-1 text-xs text-violet-600">
              <RefreshCw className="w-3 h-3" /> {repeat}
            </span>
          )}
          {task.projectTitle && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <FolderKanban className="w-3 h-3" /> {task.projectTitle}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}