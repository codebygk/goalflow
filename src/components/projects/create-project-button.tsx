"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { ProjectDialog } from "./project-dialog"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

interface CreateProjectButtonProps {
  goalId?: string
  goalTitle?: string
}

export function CreateProjectButton({ goalId, goalTitle }: CreateProjectButtonProps) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> New Project
      </Button>
      <ProjectDialog
        open={open}
        onOpenChange={setOpen}
        goalId={goalId}
        goalTitle={goalTitle}
        onSave={() => { setOpen(false); router.refresh() }}
      />
    </>
  )
}
