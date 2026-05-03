"use client"

import { useRef, useState } from "react"
import { Goal, Project, Task, Category } from "@/lib/db/schema"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Download, FileImage, FileText, TrendingUp, CheckCircle2, Target, Clock, AlertCircle, X, Loader2 } from "lucide-react"

type GoalWithCategory = Goal & { categoryName?: string | null; categoryColor?: string | null }

interface ExportCardProps {
  allGoals: GoalWithCategory[]
  allProjects: Project[]
  allTasks: Task[]
  weekTasks: Task[]
  monthTasks: Task[]
  weekCompletedTasks: Task[]
  monthCompletedTasks: Task[]
  categories: Category[]
  view: "week" | "month"
  dateRange: string
  now: string
}

const STAT_CONFIG = [
  { key: "completed", label: "Completed",   icon: CheckCircle2, gradient: "from-emerald-500 to-teal-500" },
  { key: "pending",   label: "Pending",     icon: Clock,        gradient: "from-blue-500 to-indigo-500" },
  { key: "goals",     label: "Active Goals",icon: Target,       gradient: "from-violet-500 to-purple-600" },
  { key: "overdue",   label: "Overdue",     icon: AlertCircle,  gradient: "from-rose-500 to-red-600" },
]

function Ring({ value, max, color, size = 80 }: { value: number; max: number; color: string; size?: number }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const pct = max === 0 ? 0 : Math.min(value / max, 1)
  const dash = pct * circ
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.6s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  )
}

export function ExportCard({
  allGoals, allTasks,
  weekTasks, monthTasks, weekCompletedTasks, monthCompletedTasks,
  categories, allProjects,
  view, dateRange, now,
}: ExportCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [exporting, setExporting] = useState<"pdf" | "image" | null>(null)
  const [open, setOpen] = useState(false)

  const nowDate = new Date(now)
  const activeTasks     = view === "week" ? weekTasks : monthTasks
  const completedTasks  = view === "week" ? weekCompletedTasks : monthCompletedTasks
  const pendingTasks    = activeTasks.filter(t => !t.completed)
  const overdueTasks    = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < nowDate)
  const activeGoals     = allGoals.filter(g => g.status === "active")
  const completedGoals  = allGoals.filter(g => g.status === "completed")

  const stats = {
    completed: completedTasks.length,
    pending:   pendingTasks.length,
    goals:     activeGoals.length,
    overdue:   overdueTasks.length,
  }

  const taskPct  = activeTasks.length === 0 ? 0 : Math.round(completedTasks.length / activeTasks.length * 100)
  const goalPct  = allGoals.length === 0     ? 0 : Math.round(completedGoals.length / allGoals.length * 100)

  const catBreakdown = categories.map(cat => {
    const catGoals      = allGoals.filter(g => g.categoryId === cat.id)
    const catGoalIds    = catGoals.map(g => g.id)
    const catProjects   = allProjects.filter(p => catGoalIds.includes(p.goalId ?? ""))
    const catProjectIds = catProjects.map(p => p.id)
    const catTasks      = allTasks.filter(t => catProjectIds.includes(t.projectId ?? ""))
    const catDone       = catTasks.filter(t => t.completed)
    return { ...cat, taskCount: catTasks.length, doneCount: catDone.length }
  }).filter(c => c.taskCount > 0)

  const capture = async () => {
    const { default: html2canvas } = await import("html2canvas")
    const el = cardRef.current!
    return html2canvas(el, {
      scale: 3,
      useCORS: true,
      backgroundColor: null,
      logging: false,
    })
  }

  const handleImage = async () => {
    setExporting("image")
    try {
      const canvas = await capture()
      canvas.toBlob(blob => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `goalseed-${view}-${nowDate.toISOString().split("T")[0]}.png`
        a.click()
        URL.revokeObjectURL(url)
      }, "image/png")
    } finally {
      setExporting(null)
    }
  }

  const handlePDF = async () => {
    setExporting("pdf")
    try {
      const canvas  = await capture()
      const { jsPDF } = await import("jspdf")
      const imgData = canvas.toDataURL("image/png")
      const px2mm   = 0.264583
      const w       = canvas.width  * px2mm / 3
      const h       = canvas.height * px2mm / 3
      const pdf     = new jsPDF({ orientation: w > h ? "l" : "p", unit: "mm", format: [w, h] })
      pdf.addImage(imgData, "PNG", 0, 0, w, h)
      pdf.save(`goalseed-${view}-${nowDate.toISOString().split("T")[0]}.pdf`)
    } finally {
      setExporting(null)
    }
  }

  return (
    <>
      {/* Trigger button */}
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2">
        <Download className="w-4 h-4" /> Export
      </Button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl bg-[#0a0a0f] shadow-2xl">

            {/* Close */}
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4 text-white" />
            </button>

            {/* Header */}
            <div className="px-6 pt-6 pb-4 border-b border-white/10">
              <h2 className="text-white font-semibold text-lg">Export Progress Card</h2>
              <p className="text-white/50 text-sm mt-0.5">Download as PDF or PNG image</p>
            </div>

            {/* The card to export */}
            <div className="p-6">
              <div
                ref={cardRef}
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
                  fontFamily: "'Inter', system-ui, sans-serif",
                }}
              >
                {/* Card inner */}
                <div className="p-8">

                  {/* Top row: brand + date */}
                  <div className="flex items-start justify-between mb-8">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center">
                          <TrendingUp className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white/60 text-xs font-semibold tracking-widest uppercase">GoalSeed</span>
                      </div>
                      <h2 className="text-white text-2xl font-bold mt-2">
                        {view === "week" ? "Weekly" : "Monthly"} Progress
                      </h2>
                      <p className="text-white/50 text-sm mt-0.5">{dateRange}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white/30 text-xs">
                        {nowDate.toLocaleDateString("en", { dateStyle: "medium" })}
                      </p>
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
                    {STAT_CONFIG.map(s => {
                      const Icon = s.icon
                      const val  = stats[s.key as keyof typeof stats]
                      return (
                        <div
                          key={s.key}
                          className={cn(
                            "rounded-2xl p-4 bg-gradient-to-br",
                            s.gradient,
                          )}
                          style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}
                        >
                          <Icon className="w-4 h-4 text-white/80 mb-2" />
                          <p className="text-white text-3xl font-bold leading-none">{val}</p>
                          <p className="text-white/70 text-xs mt-1.5 font-medium">{s.label}</p>
                        </div>
                      )
                    })}
                  </div>

                  {/* Progress rings + bars */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

                    {/* Task completion ring */}
                    <div className="bg-white/8 rounded-2xl p-5 flex items-center gap-5" style={{ backdropFilter: "blur(12px)" }}>
                      <div className="relative shrink-0">
                        <Ring value={completedTasks.length} max={activeTasks.length} color="#34d399" size={80} />
                        <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold">
                          {taskPct}%
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Task Completion</p>
                        <p className="text-white/50 text-xs mt-1">{completedTasks.length} of {activeTasks.length} done</p>
                        <div className="mt-3 h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${taskPct}%`, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    </div>

                    {/* Goal completion ring */}
                    <div className="bg-white/8 rounded-2xl p-5 flex items-center gap-5" style={{ backdropFilter: "blur(12px)" }}>
                      <div className="relative shrink-0">
                        <Ring value={completedGoals.length} max={allGoals.length} color="#a78bfa" size={80} />
                        <span className="absolute inset-0 flex items-center justify-center text-white text-lg font-bold">
                          {goalPct}%
                        </span>
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">Goals Progress</p>
                        <p className="text-white/50 text-xs mt-1">{completedGoals.length} of {allGoals.length} complete</p>
                        <div className="mt-3 h-1.5 w-32 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-violet-400 rounded-full" style={{ width: `${goalPct}%`, transition: "width 0.6s ease" }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Category breakdown */}
                  {catBreakdown.length > 0 && (
                    <div className="bg-white/8 rounded-2xl p-5 mb-6" style={{ backdropFilter: "blur(12px)" }}>
                      <p className="text-white/60 text-xs font-semibold uppercase tracking-widest mb-4">By Category</p>
                      <div className="space-y-3">
                        {catBreakdown.map(cat => {
                          const pct = cat.taskCount === 0 ? 0 : Math.round(cat.doneCount / cat.taskCount * 100)
                          return (
                            <div key={cat.id}>
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span className="text-white text-xs font-medium">{cat.name}</span>
                                </div>
                                <span className="text-white/50 text-xs">{cat.doneCount}/{cat.taskCount}</span>
                              </div>
                              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: cat.color, transition: "width 0.6s ease" }} />
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <p className="text-white/30 text-xs">goalseed.app</p>
                    <p className="text-white/30 text-xs">Keep growing 🌱</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Export actions */}
            <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1 h-11 gap-2 bg-white text-black hover:bg-white/90 font-semibold rounded-xl"
                onClick={handleImage}
                disabled={!!exporting}
              >
                {exporting === "image"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <FileImage className="w-4 h-4" />}
                Save as PNG
              </Button>
              <Button
                className="flex-1 h-11 gap-2 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl"
                onClick={handlePDF}
                disabled={!!exporting}
              >
                {exporting === "pdf"
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <FileText className="w-4 h-4" />}
                Save as PDF
              </Button>
            </div>

          </div>
        </div>
      )}
    </>
  )
}