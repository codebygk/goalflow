"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { taskSchema, type TaskInput } from "@/lib/validations"
import { Task } from "@/lib/db/schema"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Project { id: string; title: string }

interface TaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task?: Task
  projectId?: string
  projectTitle?: string
  onSave?: (task: Task) => void
}

export function TaskDialog({ open, onOpenChange, task, projectId, projectTitle, onSave }: TaskDialogProps) {
  const router = useRouter()
  const isEdit = !!task
  const [projects, setProjects] = useState<Project[]>([])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId ?? projectId ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
    },
  })

  useEffect(() => {
    if (open && !projectId) {
      fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects ?? []))
    }
  }, [open, projectId])

  const onSubmit = async (data: TaskInput) => {
    const url = isEdit ? `/api/tasks/${task.id}` : "/api/tasks"
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
    toast({ title: isEdit ? "Task updated" : "Task created" })
    onSave?.(json.task)
    onOpenChange(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="e.g. Write 3 posts this week" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea placeholder="Any additional details?" {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>Project</Label>
            {projectId ? (
              <Input value={projectTitle ?? projectId} disabled />
            ) : (
              <Select defaultValue={watch("projectId")} onValueChange={(v) => setValue("projectId", v)}>
                <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                <SelectContent>
                  {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select defaultValue={watch("status")} onValueChange={(v) => setValue("status", v as TaskInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select defaultValue={watch("priority")} onValueChange={(v) => setValue("priority", v as TaskInput["priority"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Due Date <span className="text-muted-foreground">(optional)</span></Label>
            <Input type="date" {...register("dueDate")} />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
