"use client"

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
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
import { Loader2, RefreshCw } from "lucide-react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

interface Project { id: string; title: string }

const DAYS = [
  { label: "Su", value: 0 },
  { label: "Mo", value: 1 },
  { label: "Tu", value: 2 },
  { label: "We", value: 3 },
  { label: "Th", value: 4 },
  { label: "Fr", value: 5 },
  { label: "Sa", value: 6 },
]

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

  const parseRepeatDays = (str?: string | null): number[] =>
    str ? str.split(",").map(Number).filter(n => !isNaN(n)) : []

  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: task?.title ?? "",
      description: task?.description ?? "",
      projectId: task?.projectId ?? projectId ?? "",
      status: task?.status ?? "todo",
      priority: task?.priority ?? "medium",
      dueDate: task?.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      repeatInterval: task?.repeatInterval ?? "none",
      repeatDays: task?.repeatDays ?? null,
      repeatMonthDay: task?.repeatMonthDay ?? null,
    },
  })

  const repeatInterval = watch("repeatInterval")
  const repeatDays = watch("repeatDays")
  const selectedDays = parseRepeatDays(repeatDays)

  const toggleDay = (day: number) => {
    const current = parseRepeatDays(repeatDays)
    const next = current.includes(day) ? current.filter(d => d !== day) : [...current, day].sort()
    setValue("repeatDays", next.length ? next.join(",") : null)
  }

  useEffect(() => {
    if (open && !projectId) {
      fetch("/api/projects").then(r => r.json()).then(d => setProjects(d.projects ?? []))
    }
  }, [open, projectId])

  // Reset repeatDays/MonthDay when interval changes
  useEffect(() => {
    if (repeatInterval === "none" || repeatInterval === "daily") {
      setValue("repeatDays", null)
      setValue("repeatMonthDay", null)
    }
    if (repeatInterval === "monthly") {
      setValue("repeatDays", null)
    }
  }, [repeatInterval, setValue])

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
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Title */}
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="e.g. Write 3 posts this week" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea placeholder="Any additional details?" {...register("description")} />
          </div>

          {/* Project */}
          <div className="space-y-1.5">
            <Label>Project</Label>
            {projectId ? (
              <Input value={projectTitle ?? projectId} disabled />
            ) : (
              <Controller
                control={control}
                name="projectId"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger><SelectValue placeholder="Select a project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map(p => <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                )}
              />
            )}
            {errors.projectId && <p className="text-xs text-destructive">{errors.projectId.message}</p>}
          </div>

          {/* Status + Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Controller control={control} name="status" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Controller control={control} name="priority" render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              )} />
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-1.5">
            <Label>Due Date <span className="text-muted-foreground">(optional)</span></Label>
            <Input type="date" {...register("dueDate")} />
          </div>

          {/* ── Repeat ── */}
          <div className="space-y-3 rounded-xl border p-4 bg-muted/30">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <Label className="mb-0">Repeat</Label>
            </div>

            <Controller control={control} name="repeatInterval" render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            )} />

            {/* Day picker for weekly / biweekly */}
            {(repeatInterval === "weekly" || repeatInterval === "biweekly") && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Repeat on</Label>
                <div className="flex gap-1.5">
                  {DAYS.map(({ label, value }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => toggleDay(value)}
                      className={cn(
                        "w-9 h-9 rounded-full text-xs font-semibold border transition-all",
                        selectedDays.includes(value)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-input hover:border-primary"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                {(!repeatDays || repeatDays === "") && (
                  <p className="text-xs text-destructive">Select at least one day</p>
                )}
              </div>
            )}

            {/* Day-of-month picker for monthly */}
            {repeatInterval === "monthly" && (
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Day of month</Label>
                <Controller control={control} name="repeatMonthDay" render={({ field }) => (
                  <Input
                    type="number"
                    min={1}
                    max={31}
                    placeholder="e.g. 15"
                    value={field.value ?? ""}
                    onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : null)}
                  />
                )} />
              </div>
            )}
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
