"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { goalSchema, type GoalInput } from "@/lib/validations"
import { Goal } from "@/lib/db/schema"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface GoalDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  goal?: Goal
  onSave?: (goal: Goal) => void
}

export function GoalDialog({ open, onOpenChange, goal, onSave }: GoalDialogProps) {
  const router = useRouter()
  const isEdit = !!goal

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<GoalInput>({
    resolver: zodResolver(goalSchema),
    defaultValues: {
      title: goal?.title ?? "",
      description: goal?.description ?? "",
      status: goal?.status ?? "active",
      targetDate: goal?.targetDate ? new Date(goal.targetDate).toISOString().split("T")[0] : "",
    },
  })

  const onSubmit = async (data: GoalInput) => {
    const url = isEdit ? `/api/goals/${goal.id}` : "/api/goals"
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
    toast({ title: isEdit ? "Goal updated" : "Goal created" })
    onSave?.(json.goal)
    onOpenChange(false)
    reset()
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Goal" : "New Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input placeholder="e.g. Reach 2K LinkedIn followers" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Description <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea placeholder="Why does this goal matter?" {...register("description")} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select defaultValue={watch("status")} onValueChange={(v) => setValue("status", v as GoalInput["status"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Target Date <span className="text-muted-foreground">(optional)</span></Label>
              <Input type="date" {...register("targetDate")} />
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving…</> : "Save Goal"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
