"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskDialog } from "./task-dialog"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateTaskButtonProps {
  projectId?: string
  projectTitle?: string
}

export function CreateTaskButton({ projectId, projectTitle }: CreateTaskButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> New Task
      </Button>
      <TaskDialog
        open={open}
        onOpenChange={setOpen}
        projectId={projectId}
        projectTitle={projectTitle}
        onSave={() => { setOpen(false); router.refresh() }}
      />
    </>
  )
}
