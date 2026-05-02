"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { CategoryDialog } from "./category-dialog"
import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"

export function CreateCategoryButton() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> New Category
      </Button>
      <CategoryDialog
        open={open}
        onOpenChange={setOpen}
        onSave={() => { setOpen(false); router.refresh() }}
      />
    </>
  )
}
