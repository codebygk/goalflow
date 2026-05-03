"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDate, getStatusColor, getPriorityColor } from "@/lib/utils"
import { repeatLabel, nextRepeatDate } from "@/lib/repeat-utils"
import {
  CheckSquare, Pencil, Trash2, Calendar, FolderKanban, Search, ArrowUpDown,
  Flag, ChevronDown, ChevronUp, RefreshCw, Trash, RotateCcw, Plus, Sun,
  CalendarDays, CalendarRange, Inbox
} from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Task } from "@/lib/db/schema"
import Link from "next/link"

export type TaskWithProject = Task & { projectTitle?: string | null }

interface TasksListProps {
  initialTasks: TaskWithProject[]
  projectId?: string
  trashMode?: boolean
}

const PRIORITY_CYCLE = ["low", "medium", "high", "urgent"] as const
const STATUS_CYCLE = ["todo", "in_progress", "done", "cancelled"] as const

function TaskRow({
  task, onToggle, onEdit, onDelete, onRestore, onCyclePriority, onCycleStatus, onSchedule, trashMode,
}: {
  task: TaskWithProject
  onToggle: (t: TaskWithProject) => void
  onEdit: (t: TaskWithProject) => void
  onDelete: (id: string) => void
  onRestore?: (id: string) => void
  onCyclePriority?: (t: TaskWithProject) => void
  onCycleStatus?: (t: TaskWithProject) => void
  onSchedule?: (t: TaskWithProject, when: "today" | "tomorrow" | "this-week" | "later") => void
  trashMode?: boolean
}) {
  const repeat = repeatLabel(task)

  const isToday = (() => {
    if (!task.dueDate) return false
    const d = new Date(task.dueDate)
    const now = new Date()
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
  })()

  return (
    <div
      onClick={() => !trashMode && onEdit(task)}
      className={cn(
        "bg-white border rounded-2xl p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all group",
        task.status === "done" && !trashMode && "opacity-60",
        !trashMode && "cursor-pointer hover:border-primary/30",
      )}
    >
      {/* Checkbox - stop propagation so clicking it doesn't open dialog */}
      <div onClick={e => e.stopPropagation()}>
        {!trashMode ? (
          <button
            onClick={() => onToggle(task)}
            className={cn(
              "mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors",
              task.status === "done"
                ? "bg-emerald-500 border-emerald-500"
                : "border-muted-foreground hover:border-primary"
            )}
          >
            {task.status === "done" && <span className="text-white text-xs font-bold">✓</span>}
          </button>
        ) : (
          <div className="mt-0.5 w-5 h-5 rounded-full border-2 border-red-300 flex items-center justify-center shrink-0">
            <Trash className="w-3 h-3 text-red-400" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={cn("font-medium text-sm", task.status === "done" && !trashMode && "line-through text-muted-foreground")}>
            {task.title}
          </span>
          {/* Clickable status badge — cycles through statuses */}
          {!trashMode ? (
            <button
              onClick={e => { e.stopPropagation(); onCycleStatus?.(task) }}
              title="Click to change status"
              className="focus:outline-none"
            >
              <Badge className={cn("capitalize border text-xs cursor-pointer hover:opacity-80 transition-opacity", getStatusColor(task.status))}>
                {task.status.replace("_", " ")}
              </Badge>
            </button>
          ) : (
            <Badge className={cn("capitalize border text-xs", getStatusColor(task.status))}>
              {task.status.replace("_", " ")}
            </Badge>
          )}
        </div>
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
        )}
        <div className="flex items-center gap-3 mt-1.5 flex-wrap">
          {/* Clickable priority — cycles through priorities */}
          {!trashMode ? (
            <button
              onClick={e => { e.stopPropagation(); onCyclePriority?.(task) }}
              title="Click to change priority"
              className={cn("flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity", getPriorityColor(task.priority))}
            >
              <Flag className="w-3 h-3" /> {task.priority}
            </button>
          ) : (
            <span className={cn("flex items-center gap-1 text-xs font-medium", getPriorityColor(task.priority))}>
              <Flag className="w-3 h-3" /> {task.priority}
            </span>
          )}
          {task.dueDate && (
            <span className={cn("flex items-center gap-1 text-xs", isToday ? "text-amber-500 font-medium" : "text-muted-foreground")}>
              <Calendar className="w-3 h-3" /> {isToday ? "Today" : formatDate(task.dueDate)}
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

      {/* Actions */}
      <div
        className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0"
        onClick={e => e.stopPropagation()}
      >
        {trashMode ? (
          <>
            {/* Restore */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
              onClick={() => onRestore?.(task.id)}
              title="Restore"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>

            {/* Permanent delete */}
            <DeleteConfirm
              title="Delete permanently?"
              description="This action cannot be undone."
              onConfirm={() => onDelete(task.id)} // we will override this
            >
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </DeleteConfirm>
          </>
        ) : (
          <>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(task)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <DeleteConfirm
              title="Move to Trash?"
              description="The task will be moved to trash and can be restored later."
              onConfirm={() => onDelete(task.id)}
            >
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </DeleteConfirm>
          </>
        )}
      </div>
    </div>
  )
}

export function TasksList({ initialTasks, projectId, trashMode = false }: TasksListProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [editTarget, setEditTarget] = useState<TaskWithProject | null>(null)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const router = useRouter()
  const [createOpen, setCreateOpen] = useState(false)

  const handleAdd = (newTask: Task) => {
    setTasks(prev => [{
      ...newTask,
    }, ...prev])
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(field); setSortDir("desc") }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id))
      toast({ title: "Moved to trash" })
      router.refresh()
    }
  }

  const handlePermanentDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}/delete`, {
      method: "DELETE",
    })

    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id))
      toast({ title: "Task permanently deleted" })
      router.refresh()
    }
  }

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}/restore`, { method: "POST" })
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id))
      toast({ title: "Task restored" })
      router.refresh()
    }
  }

  const toggleDone = async (task: TaskWithProject) => {
    const isRecurring = task.repeatInterval !== "none"
    if (isRecurring && task.status !== "done") {
      // For recurring tasks: advance dueDate to next occurrence, keep as todo
      const next = nextRepeatDate(task)
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDate: next ? next.toISOString() : null, status: "todo" }),
      })
      if (res.ok) {
        const json = await res.json()
        setTasks(prev => prev.map(t => t.id === task.id ? { ...json.task, projectTitle: t.projectTitle } : t))
        toast({ title: "Task done! Next instance scheduled ↻" })
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
    }
  }

  const handleCyclePriority = async (task: TaskWithProject) => {
    const idx = PRIORITY_CYCLE.indexOf(task.priority as typeof PRIORITY_CYCLE[number])
    const nextPriority = PRIORITY_CYCLE[(idx + 1) % PRIORITY_CYCLE.length]
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ priority: nextPriority }),
    })
    if (res.ok) {
      const json = await res.json()
      setTasks(prev => prev.map(t => t.id === task.id ? { ...json.task, projectTitle: t.projectTitle } : t))
      toast({ title: `Priority set to ${nextPriority}` })
    }
  }

  const handleCycleStatus = async (task: TaskWithProject) => {
    const idx = STATUS_CYCLE.indexOf(task.status as typeof STATUS_CYCLE[number])
    const nextStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    })
    if (res.ok) {
      const json = await res.json()
      setTasks(prev => prev.map(t => t.id === task.id ? { ...json.task, projectTitle: t.projectTitle } : t))
      toast({ title: `Status set to ${nextStatus.replace("_", " ")}` })
      router.refresh()
    }
  }

  const handleSchedule = async (task: TaskWithProject, when: "today" | "tomorrow" | "this-week" | "later") => {
    let dueDate: string | null = null
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    if (when === "today") {
      dueDate = now.toISOString()
    } else if (when === "tomorrow") {
      const d = new Date(now); d.setDate(d.getDate() + 1)
      dueDate = d.toISOString()
    } else if (when === "this-week") {
      // End of this week (Sunday=0 ... Saturday=6 → next Friday or end of week)
      const d = new Date(now)
      const daysUntilEndOfWeek = 7 - d.getDay() // days until next Sunday; use Friday instead
      d.setDate(d.getDate() + Math.max(2, daysUntilEndOfWeek - 1))
      dueDate = d.toISOString()
    } else {
      // later — clear due date
      dueDate = null
    }
    const res = await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dueDate }),
    })
    if (res.ok) {
      const json = await res.json()
      setTasks(prev => prev.map(t => t.id === task.id ? { ...json.task, projectTitle: t.projectTitle } : t))
      const labels = { today: "Added to Today ☀️", tomorrow: "Scheduled for Tomorrow", "this-week": "Scheduled for This Week", later: "Moved to Later" }
      toast({ title: labels[when] })
      router.refresh()
    }
  }


  const filteredTasks = tasks.filter(t => {
    if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
    if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
    return true
  })
    .sort((a, b) => {
      let va: any, vb: any
      if (sortBy === "title") { va = a.title; vb = b.title }
      else if (sortBy === "priority") {
        const order = ["urgent", "high", "medium", "low"]
        va = order.indexOf(a.priority); vb = order.indexOf(b.priority)
      }
      else if (sortBy === "dueDate") { va = Date.parse(a.dueDate?.toString() ?? "0"); vb = Date.parse(b.dueDate?.toString() ?? "0") }
      else { va = Date.parse(a.createdAt.toString()); vb = Date.parse(b.createdAt.toString()) }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })

  const activeTasks = filteredTasks.filter(t => t.status !== "done")
  const doneTasks = filteredTasks.filter(t => t.status === "done")

  const rowProps = {
    onToggle: toggleDone,
    onEdit: setEditTarget,
    onDelete: trashMode ? handlePermanentDelete : handleDelete,
    onRestore: handleRestore,
    onCyclePriority: handleCyclePriority,
    onCycleStatus: handleCycleStatus,
    onSchedule: handleSchedule,
    trashMode,
  }

  return (
    <>
      {editTarget && (
        <TaskDialog
          open={!!editTarget}
          onOpenChange={open => { if (!open) setEditTarget(null) }}
          task={editTarget}
          projectId={projectId}
          onSave={updated => {
            setTasks(prev => prev.map(t => t.id === updated.id ? { ...updated, projectTitle: editTarget.projectTitle } : t))
            setEditTarget(null)
          }}
        />
      )}
      {createOpen && (
        <TaskDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSave={handleAdd}
        />
      )}
      {tasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-white">
          {trashMode
            ? <><Trash className="w-10 h-10 mx-auto opacity-30" />
              <p className="font-medium">Trash is empty</p></>
            : <div className="flex flex-col items-center gap-2">
              <CheckSquare className="w-10 h-10 mx-auto opacity-30" />
              <p className="font-medium">No tasks yet</p>
              <p className="text-sm">Create your first actionable task</p>
              <Button size={"sm"} onClick={() => setCreateOpen(true)} className="mt-3">
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </div>
          }
        </div>
      )}
      {tasks.length > 0 && (
        <>
          {(!trashMode && (
            <div className="flex flex-col sm:flex-row gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search tasks…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Priority" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex gap-1">
                {[
                  { key: "createdAt", label: "Date" },
                  { key: "title", label: "A–Z" },
                  { key: "priority", label: "Priority" },
                  { key: "dueDate", label: "Due" },
                ].map(s => (
                  <Button key={s.key} variant={sortBy === s.key ? "default" : "outline"} size="sm" onClick={() => toggleSort(s.key)} className="gap-1 text-xs px-2">
                    {s.label}{sortBy === s.key && <ArrowUpDown className="w-3 h-3" />}
                  </Button>
                ))}
              </div>
              <Button size={"sm"} onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" /> New Task
              </Button>
            </div>
          ))}

          <div className="space-y-2">
            {(trashMode ? tasks : activeTasks).map(task => (
              <TaskRow key={task.id} task={task} {...rowProps} />
            ))}
          </div>
        </>
      )}

      {!trashMode && doneTasks.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => setCompletedOpen(o => !o)}
            className="flex items-center gap-2 text-sm text-muted-foreground font-medium hover:text-foreground transition-colors px-1 py-2 w-full"
          >
            {completedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            Completed ({doneTasks.length})
          </button>
          {completedOpen && (
            <div className="space-y-2 mt-2">
              {doneTasks.map(task => (
                <TaskRow key={task.id} task={task} {...rowProps} />
              ))}
            </div>
          )}
        </div>
      )}
      {editTarget && (
        <TaskDialog
          open={!!editTarget}
          onOpenChange={open => { if (!open) setEditTarget(null) }}
          task={editTarget}
          projectId={projectId}
          onSave={updated => {
            setTasks(prev => prev.map(t => t.id === updated.id ? { ...updated, projectTitle: editTarget.projectTitle } : t))
            setEditTarget(null)
          }}
        />
      )}
      {createOpen && (
        <TaskDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSave={handleAdd}
        />
      )}
    </>

  )
}