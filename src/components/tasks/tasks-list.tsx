"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, formatDate, getStatusColor, getPriorityColor } from "@/lib/utils"
import { repeatLabel } from "@/lib/repeat-utils"
import {
  CheckSquare, Pencil, Trash2, Calendar, FolderKanban, Search, ArrowUpDown,
  Flag, ChevronDown, ChevronUp, RefreshCw, Plus, Sun,
} from "lucide-react"
import { TaskDialog } from "./task-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Task } from "@/lib/db/schema"

export type TaskWithProject = Task & { projectTitle?: string | null; isToday?: boolean }

interface TasksListProps {
  initialTasks: TaskWithProject[]
  projectId?: string
}

const PRIORITY_ORDER = ["urgent", "high", "medium", "low"]

const PRIORITY_STYLES: Record<string, string> = {
  urgent: "bg-red-100 text-red-700 border-red-200",
  high:   "bg-orange-100 text-orange-700 border-orange-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low:    "bg-slate-100 text-slate-600 border-slate-200",
}

const STATUS_OPTIONS = ["todo", "in_progress", "done", "cancelled"] as const
type TaskStatus = typeof STATUS_OPTIONS[number]

function TaskRow({
  task,
  onToggle,
  onEdit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  onTodayToggle,
}: {
  task: TaskWithProject
  onToggle: (t: TaskWithProject) => void
  onEdit: (t: TaskWithProject) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, status: TaskStatus) => void
  onPriorityChange: (id: string, priority: string) => void
  onTodayToggle: (t: TaskWithProject) => void
}) {
  const repeat = repeatLabel(task)
  const isDone = task.status === "done"

  return (
    <div
      onClick={() => onEdit(task)}
      className={cn(
        "bg-white border rounded-2xl p-3 md:p-4 flex items-start gap-3 shadow-sm hover:shadow-md transition-all group cursor-pointer hover:border-primary/30",
        isDone && "opacity-60",
      )}
    >
      {/* Done toggle */}
      <div onClick={e => e.stopPropagation()} className="pt-0.5 shrink-0">
        <button
          onClick={() => onToggle(task)}
          className={cn(
            "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            isDone ? "bg-emerald-500 border-emerald-500" : "border-muted-foreground hover:border-primary"
          )}
        >
          {isDone && <span className="text-white text-xs font-bold">✓</span>}
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <span className={cn("font-medium text-sm", isDone && "line-through text-muted-foreground")}>
          {task.title}
        </span>

        {/* Description */}
        {task.description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>
        )}

        {/* Inline controls row */}
        <div
          className="flex items-center gap-1.5 mt-2 flex-wrap"
          onClick={e => e.stopPropagation()}
        >
          {/* Status pill */}
          <Select value={task.status} onValueChange={v => onStatusChange(task.id, v as TaskStatus)}>
            <SelectTrigger className={cn(
              "h-6 px-2 text-xs rounded-full border font-medium gap-1 w-auto focus:ring-0 shadow-none",
              getStatusColor(task.status),
            )}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">Todo</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Priority pill */}
          <Select value={task.priority} onValueChange={v => onPriorityChange(task.id, v)}>
            <SelectTrigger className={cn(
              "h-6 px-2 text-xs rounded-full border font-medium gap-1 w-auto focus:ring-0 shadow-none",
              PRIORITY_STYLES[task.priority],
            )}>
              <Flag className="w-2.5 h-2.5 shrink-0" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          {/* Due date */}
          {task.dueDate && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" /> {formatDate(task.dueDate)}
            </span>
          )}

          {/* Repeat */}
          {repeat && (
            <span className="flex items-center gap-1 text-xs text-violet-600">
              <RefreshCw className="w-3 h-3" /> {repeat}
            </span>
          )}

          {/* Project */}
          {task.projectTitle && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <FolderKanban className="w-3 h-3" /> {task.projectTitle}
            </span>
          )}
        </div>
      </div>

      {/* Action buttons — visible on hover */}
      <div
        className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 pt-0.5"
        onClick={e => e.stopPropagation()}
      >
        {/* Add to Today */}
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-7 w-7",
            task.isToday ? "text-amber-500 hover:text-amber-600" : "text-muted-foreground hover:text-amber-500"
          )}
          title={task.isToday ? "Remove from Today" : "Add to Today"}
          onClick={() => onTodayToggle(task)}
        >
          <Sun className="w-3.5 h-3.5" />
        </Button>

        {/* Edit */}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(task)}>
          <Pencil className="w-3.5 h-3.5" />
        </Button>

        {/* Delete */}
        <DeleteConfirm
          title="Move to Trash?"
          description="The task will be moved to trash and can be restored later."
          onConfirm={() => onDelete(task.id)}
        >
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </DeleteConfirm>
      </div>
    </div>
  )
}

export function TasksList({ initialTasks, projectId }: TasksListProps) {
  const [tasks, setTasks] = useState(initialTasks)
  const [editTarget, setEditTarget] = useState<TaskWithProject | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [completedOpen, setCompletedOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  const router = useRouter()

  const patchTask = async (id: string, body: object) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
    if (res.ok) {
      const json = await res.json()
      setTasks(prev => prev.map(t => t.id === id ? { ...json.task, projectTitle: t.projectTitle, isToday: t.isToday } : t))
    }
    return res
  }

  const handleToggleDone = (task: TaskWithProject) =>
    patchTask(task.id, { status: task.status === "done" ? "todo" : "done" })

  const handleStatusChange = (id: string, status: TaskStatus) =>
    patchTask(id, { status })

  const handlePriorityChange = (id: string, priority: string) =>
    patchTask(id, { priority })

  const handleTodayToggle = async (task: TaskWithProject) => {
    const adding = !task.isToday
    const res = await fetch("/api/my-day", {
      method: adding ? "POST" : "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId: task.id }),
    })
    if (res.ok) {
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, isToday: adding } : t))
      toast({ title: adding ? "Added to Today" : "Removed from Today" })
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "DELETE" })
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id))
      toast({ title: "Moved to trash" })
      router.refresh()
    }
  }

  const handleAdd = (newTask: Task) => {
    setTasks(prev => [{ ...newTask, projectTitle: prev[0]?.projectTitle ?? null }, ...prev])
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(field); setSortDir("desc") }
  }

  const filtered = tasks
    .filter(t => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false
      if (priorityFilter !== "all" && t.priority !== priorityFilter) return false
      return true
    })
    .sort((a, b) => {
      let va: any, vb: any
      if (sortBy === "title") { va = a.title; vb = b.title }
      else if (sortBy === "priority") { va = PRIORITY_ORDER.indexOf(a.priority); vb = PRIORITY_ORDER.indexOf(b.priority) }
      else if (sortBy === "dueDate") { va = Date.parse(a.dueDate?.toString() ?? "0"); vb = Date.parse(b.dueDate?.toString() ?? "0") }
      else { va = Date.parse(a.createdAt.toString()); vb = Date.parse(b.createdAt.toString()) }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })

  const activeTasks = filtered.filter(t => t.status !== "done")
  const doneTasks = filtered.filter(t => t.status === "done")

  const rowProps = {
    onToggle: handleToggleDone,
    onEdit: setEditTarget,
    onDelete: handleDelete,
    onStatusChange: handleStatusChange,
    onPriorityChange: handlePriorityChange,
    onTodayToggle: handleTodayToggle,
  }

  return (
    <>
      {/* Toolbar */}
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
            <Button key={s.key} variant={sortBy === s.key ? "default" : "outline"} size="sm"
              onClick={() => toggleSort(s.key)} className="gap-1 text-xs px-2">
              {s.label}{sortBy === s.key && <ArrowUpDown className="w-3 h-3" />}
            </Button>
          ))}
        </div>
        <Button size={"sm"} onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Task
        </Button>
      </div>

      {/* List */}
      {tasks.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-white">
          <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No tasks yet</p>
          <p className="text-sm mt-1">Add your first task above</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {activeTasks.map(task => <TaskRow key={task.id} task={task} {...rowProps} />)}
          </div>

          {doneTasks.length > 0 && (
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
                  {doneTasks.map(task => <TaskRow key={task.id} task={task} {...rowProps} />)}
                </div>
              )}
            </div>
          )}
        </>
      )}

      {createOpen && (
        <TaskDialog open={createOpen} onOpenChange={setCreateOpen} projectId={projectId}
          onSave={newTask => { handleAdd(newTask); setCreateOpen(false) }} />
      )}

      {editTarget && (
        <TaskDialog open={!!editTarget} onOpenChange={open => { if (!open) setEditTarget(null) }}
          task={editTarget} projectId={projectId}
          onSave={updated => {
            setTasks(prev => prev.map(t => t.id === updated.id
              ? { ...updated, projectTitle: editTarget.projectTitle, isToday: editTarget.isToday } : t))
            setEditTarget(null)
          }} />
      )}
    </>
  )
}