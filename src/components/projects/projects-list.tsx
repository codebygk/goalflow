"use client"

import { useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, getStatusColor } from "@/lib/utils"
import { FolderKanban, ChevronRight, Pencil, Trash2, Target } from "lucide-react"
import { ProjectDialog } from "./project-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import { Project } from "@/lib/db/schema"

type ProjectWithGoal = Project & { goalTitle?: string | null }

interface ProjectsListProps {
  initialProjects: ProjectWithGoal[]
  goalId?: string
}

export function ProjectsList({ initialProjects, goalId }: ProjectsListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [editTarget, setEditTarget] = useState<ProjectWithGoal | null>(null)
  const router = useRouter()

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (res.ok) {
      setProjects((prev) => prev.filter((p) => p.id !== id))
      toast({ title: "Project deleted" })
      router.refresh()
    }
  }

  if (projects.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground border rounded-2xl bg-white">
        <FolderKanban className="w-10 h-10 mx-auto mb-3 opacity-30" />
        <p className="font-medium">No projects yet</p>
        <p className="text-sm mt-1">Add a project to this goal to get started</p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-3">
        {projects.map((project) => (
          <div key={project.id} className="bg-white border rounded-2xl p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow group">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
              <FolderKanban className="w-5 h-5 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-sm">{project.title}</span>
                <Badge className={cn("capitalize border text-xs", getStatusColor(project.status))}>
                  {project.status.replace("_", " ")}
                </Badge>
              </div>
              {project.description && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>
              )}
              {project.goalTitle && (
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                  <Target className="w-3 h-3" /> {project.goalTitle}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button variant="ghost" size="icon" onClick={() => setEditTarget(project)}>
                <Pencil className="w-4 h-4" />
              </Button>
              <DeleteConfirm onConfirm={() => handleDelete(project.id)}>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </DeleteConfirm>
            </div>
            <Link href={`/projects/${project.id}`} className="shrink-0">
              <ChevronRight className="w-5 h-5 text-muted-foreground hover:text-foreground transition-colors" />
            </Link>
          </div>
        ))}
      </div>

      {editTarget && (
        <ProjectDialog
          open={!!editTarget}
          onOpenChange={(open) => { if (!open) setEditTarget(null) }}
          project={editTarget}
          goalId={goalId}
          onSave={(updated) => {
            setProjects((prev) => prev.map((p) => p.id === updated.id ? { ...updated, goalTitle: editTarget.goalTitle } : p))
            setEditTarget(null)
          }}
        />
      )}
    </>
  )
}
