"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn, formatDate, getPriorityColor } from "@/lib/utils"
import { Trash2, Search, RotateCcw, Trash, Flag, Calendar, FolderKanban } from "lucide-react"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { Task } from "@/lib/db/schema"

export type TaskWithProject = Task & { projectTitle?: string | null }

export function TrashList({ initialTasks }: { initialTasks: TaskWithProject[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [search, setSearch] = useState("")

  const handleRestore = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}/restore`, { method: "POST" })
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id))
      toast({ title: "Task restored" })
    }
  }

  const handleHardDelete = async (id: string) => {
    const res = await fetch(`/api/tasks/${id}`, { method: "PUT" })
    if (res.ok) {
      setTasks(prev => prev.filter(t => t.id !== id))
      toast({ title: "Task permanently deleted" })
    }
  }

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search trash…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-white">
          <Trash className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">{tasks.length === 0 ? "Trash is empty" : "No results"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <div
              key={task.id}
              className="bg-white border border-red-100 rounded-2xl p-3 md:p-4 flex items-start gap-3 shadow-sm group"
            >
              {/* Trash icon */}
              <div className="pt-0.5 shrink-0">
                <div className="w-5 h-5 rounded-full border-2 border-red-200 flex items-center justify-center">
                  <Trash className="w-3 h-3 text-red-400" />
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <span className="font-medium text-sm text-muted-foreground line-through">{task.title}</span>
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

              {/* Actions */}
              <div className="flex items-center gap-0.5 md:opacity-0 md:group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
                <Button
                  variant="ghost" size="icon"
                  className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                  title="Restore"
                  onClick={() => handleRestore(task.id)}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
                <DeleteConfirm
                  title="Delete permanently?"
                  description="This task will be gone forever. This cannot be undone."
                  onConfirm={() => handleHardDelete(task.id)}
                >
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Delete permanently">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </DeleteConfirm>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}