"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn, getStatusColor } from "@/lib/utils"
import { FolderKanban, Pencil, Trash2, Target, Search, ArrowUpDown, Plus, List, LayoutGrid } from "lucide-react"
import { ProjectDialog } from "./project-dialog"
import { DeleteConfirm } from "@/components/ui/delete-confirm"
import { toast } from "@/hooks/use-toast"
import { Project } from "@/lib/db/schema"

type ProjectWithGoal = Project & { goalTitle?: string | null }
type ViewMode = "list" | "grid"

const VIEW_MODE_KEY = "projects_view_mode"

interface ProjectsListProps {
  initialProjects: ProjectWithGoal[]
  goalId?: string
}

export function ProjectsList({ initialProjects, goalId }: ProjectsListProps) {
  const [projects, setProjects] = useState(initialProjects)
  const [editTarget, setEditTarget] = useState<ProjectWithGoal | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")
  // Always start with "list" — matches SSR output, preventing hydration mismatch.
  // useEffect applies the saved preference after hydration is complete.
  const [viewMode, setViewMode] = useState<ViewMode>("list")
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    try {
      const saved = localStorage.getItem(VIEW_MODE_KEY)
      if (saved === "grid" || saved === "list") setViewMode(saved)
    } catch {}
    setMounted(true)
  }, [])

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode)
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode)
    } catch {}
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/projects/${id}`, { method: "DELETE" })
    if (res.ok) {
      setProjects(prev => prev.filter(p => p.id !== id))
      toast({ title: "Project deleted" })
      router.refresh()
    }
  }

  const handleAdd = (newProject: Project) => {
    setProjects(prev => [newProject, ...prev])
  }

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortDir(d => d === "asc" ? "desc" : "asc")
    else { setSortBy(field); setSortDir("desc") }
  }

  const filtered = projects
    .filter(p => {
      if (search && !p.title.toLowerCase().includes(search.toLowerCase()) &&
        !(p.description ?? "").toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      return true
    })
    .sort((a, b) => {
      let va: any, vb: any
      if (sortBy === "title") { va = a.title; vb = b.title }
      else if (sortBy === "status") { va = a.status; vb = b.status }
      else { va = Date.parse(a.createdAt.toString()); vb = Date.parse(b.createdAt.toString()) }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })

  // Before mount: always render "list" so server HTML === first client render.
  // After mount: use the real saved preference (no visible flash because
  // useEffect fires synchronously before the browser paints in practice).
  const effectiveView: ViewMode = mounted ? viewMode : "list"

  return (
    <>
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 text-center py-16 text-muted-foreground border rounded-2xl bg-white">
          <FolderKanban className="w-10 h-10 mx-auto opacity-30" />
          <p className="font-medium">{projects.length === 0 ? "No projects yet" : "No projects match"}</p>
          <p className="text-sm">{projects.length === 0 ? "Add your first project to get started" : "Try adjusting filters"}</p>
          <Button size={"sm"} onClick={() => setCreateOpen(true)} className="mt-3">
            <Plus className="w-4 h-4 mr-2" /> New Project
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Controls toolbar */}
          <div className="flex flex-col sm:flex-row gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search projects…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="on_hold">On Hold</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-1">
              {[
                { key: "createdAt", label: "Date" },
                { key: "title", label: "A–Z" },
                { key: "status", label: "Status" },
              ].map(s => (
                <Button key={s.key} variant={sortBy === s.key ? "default" : "outline"} size="sm" onClick={() => toggleSort(s.key)} className="gap-1 text-xs px-2">
                  {s.label}{sortBy === s.key && <ArrowUpDown className="w-3 h-3" />}
                </Button>
              ))}
            </div>

            {/* View mode toggle */}
            <div className="flex items-center rounded-md border bg-muted p-0.5 gap-0.5 h-9">
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-sm transition-all",
                  effectiveView === "list" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleViewModeChange("list")}
                title="List view"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-7 w-7 rounded-sm transition-all",
                  effectiveView === "grid" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => handleViewModeChange("grid")}
                title="Grid view"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
            </div>

            <Button size={"sm"} onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> New Project
            </Button>
          </div>

          {/* ── List view ───────────────────────────────────────────────────── */}
          {effectiveView === "list" ? (
            <div className="space-y-3">
              {filtered.map(project => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-white border rounded-2xl p-4 md:p-5 flex items-center gap-3 md:gap-4 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group"
                >
                  <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                    <FolderKanban className="w-4 h-4 md:w-5 md:h-5 text-violet-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-sm">{project.title}</span>
                      <Badge className={cn("capitalize border text-xs", getStatusColor(project.status))}>
                        {project.status.replace("_", " ")}
                      </Badge>
                    </div>
                    {project.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{project.description}</p>}
                    {project.goalTitle && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Target className="w-3 h-3" /> {project.goalTitle}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); setEditTarget(project) }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <DeleteConfirm onConfirm={() => handleDelete(project.id)}>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </DeleteConfirm>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* ── Grid view ────────────────────────────────────────────────── */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(project => (
                <div
                  key={project.id}
                  onClick={() => router.push(`/projects/${project.id}`)}
                  className="bg-white border rounded-2xl p-5 flex flex-col gap-3 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary/30 group relative"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5 text-violet-600" />
                    </div>
                    <div
                      className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={e => { e.stopPropagation(); setEditTarget(project) }}>
                        <Pencil className="w-3 h-3" />
                      </Button>
                      <DeleteConfirm onConfirm={() => handleDelete(project.id)}>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </DeleteConfirm>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug line-clamp-2">{project.title}</p>
                    {project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{project.description}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t">
                    <Badge className={cn("capitalize border text-xs", getStatusColor(project.status))}>
                      {project.status.replace("_", " ")}
                    </Badge>
                    {project.goalTitle && (
                      <span className="ml-auto text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                        <Target className="w-3 h-3" /> {project.goalTitle}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {createOpen && (
        <ProjectDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          goalId={goalId}
          onSave={newProject => { handleAdd(newProject); setCreateOpen(false) }}
        />
      )}

      {editTarget && (
        <ProjectDialog
          open={!!editTarget}
          onOpenChange={open => { if (!open) setEditTarget(null) }}
          project={editTarget}
          goalId={goalId}
          onSave={updated => {
            setProjects(prev => prev.map(p => p.id === updated.id ? { ...updated, goalTitle: editTarget.goalTitle } : p))
            setEditTarget(null)
          }}
        />
      )}
    </>
  )
}