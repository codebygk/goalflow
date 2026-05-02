"use client"

import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { projectSchema, type ProjectInput } from "@/lib/validations"
import { Project } from "@/lib/db/schema"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Goal { id: string; title: string }

interface ProjectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  project?: Project
  goalId?: string
  goalTitle?: string
  onSave?: (project: Project) => void
}

export function ProjectDialog({ open, onOpenChange, project, goalId, goalTitle, onSave }: ProjectDialogProps) {
  const router = useRouter()
  const isEdit = !!project
  const [goals, setGoals] = useState<Goal[]>([])

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<ProjectInput>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: project?.title ?? "",
      description: project?.description ?? "",
      goalId: project?.goalId ?? goalId ?? "",
      status: project?.status ?? "active",
    },
  })

  useEffect(() => {
    if (open && !goalId) {
      fetch("/api/goals").then(r => r.json()).then(d => setGoals(d.goals ?? []))
    }
  }, [open, goalId])

  const onSubmit = async (data: ProjectInput) => {
    const url = isEdit ? `/api/projects/${project.id}` : "/api/projects"
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
    toast({ title: isEdit ? "Project updated" : "Project created" })
    onSave?.(json.project)
    onOpenChange(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Project" : "New Project"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="e.g. Content Creation" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea placeholder="What is this project about?" {...register("description")} />
          </div>
          <div className="space-y-1.5">
            <Label>Goal</Label>
            {goalId ? (
              <Input value={goalTitle ?? goalId} disabled />
            ) : (
              <Select defaultValue={watch("goalId")} onValueChange={(v) => setValue("goalId", v)}>
                <SelectTrigger><SelectValue placeholder="Select a goal" /></SelectTrigger>
                <SelectContent>
                  {goals.map(g => <SelectItem key={g.id} value={g.id}>{g.title}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {errors.goalId && <p className="text-xs text-destructive">{errors.goalId.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Status</Label>
            <Select defaultValue={watch("status")} onValueChange={(v) => setValue("status", v as ProjectInput["status"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Project"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
