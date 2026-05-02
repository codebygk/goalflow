"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { GoalDialog } from "./goal-dialog"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Goal } from "@/lib/db/schema"

export function CreateGoalButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> New Goal
      </Button>
      <GoalDialog
        open={open}
        onOpenChange={setOpen}
        onSave={() => { setOpen(false); router.refresh() }}
      />
    </>
  )
}
