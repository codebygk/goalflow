"use client"

import { useState } from "react"
import { Goal, Project, Task, Category } from "@/lib/db/schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn, getStatusColor } from "@/lib/utils"
import {
  Target, FolderKanban, CheckSquare, TrendingUp, Calendar,
  Tag, CheckCircle2, Circle
} from "lucide-react"
import { ExportCard } from "./export-card"

type GoalWithCategory = Goal & { categoryName?: string | null; categoryColor?: string | null }

interface OverviewClientProps {
  allGoals: GoalWithCategory[]
  allProjects: Project[]
  allTasks: Task[]
  weekTasks: Task[]
  monthTasks: Task[]
  weekCompletedTasks: Task[]
  monthCompletedTasks: Task[]
  categories: Category[]
  weekRange: { start: string; end: string }
  monthRange: { start: string; end: string }
  now: string
}

function StatPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn("rounded-xl p-4 text-white", color)}>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm opacity-90 mt-0.5">{label}</p>
    </div>
  )
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max === 0 ? 0 : Math.round((value / max) * 100)
  return (
    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export function OverviewClient({
  allGoals, allProjects, allTasks,
  weekTasks, monthTasks, weekCompletedTasks, monthCompletedTasks,
  categories, weekRange, monthRange, now,
}: OverviewClientProps) {
  const [view, setView] = useState<"week" | "month">("week")

  const nowDate = new Date(now)
  const weekStart = new Date(weekRange.start)
  const weekEnd = new Date(weekRange.end)
  const monthStart = new Date(monthRange.start)
  const monthEnd = new Date(monthRange.end)

  const activeTasks = view === "week" ? weekTasks : monthTasks
  const completedTasks = view === "week" ? weekCompletedTasks : monthCompletedTasks
  const pendingTasks = activeTasks.filter(t => !t.completed)
  const overdueTasks = allTasks.filter(t => !t.completed && t.dueDate && new Date(t.dueDate) < nowDate)

  const activeGoals = allGoals.filter(g => g.status === "active")
  const completedGoals = allGoals.filter(g => g.status === "completed")

  // Category breakdown
  const catBreakdown = categories.map(cat => {
    const catGoals = allGoals.filter(g => g.categoryId === cat.id)
    const catGoalIds = catGoals.map(g => g.id)
    const catProjects = allProjects.filter(p => catGoalIds.includes(p.goalId))
    const catProjectIds = catProjects.map(p => p.id)
    const catTasks = allTasks.filter(t => catProjectIds.includes(t.projectId || "") && ((view === "week" && new Date(t.createdAt) >= weekStart && new Date(t.createdAt) <= weekEnd) || (view === "month" && new Date(t.createdAt) >= monthStart && new Date(t.createdAt) <= monthEnd)))
    const catDone = catTasks.filter(t => t.completed)
    return { ...cat, goals: catGoals.length, tasks: catTasks.length, done: catDone.length }
  })

  const formatDateRange = () => {
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" }
    if (view === "week") {
      return `${weekStart.toLocaleDateString("en", opts)} – ${weekEnd.toLocaleDateString("en", opts)}`
    }
    return monthStart.toLocaleDateString("en", { month: "long", year: "numeric" })
  }


  return (
    <div className="space-y-6">
      {/* View toggle */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-2">
        <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="flex rounded-lg border bg-white overflow-hidden">
          <button
            onClick={() => setView("week")}
            className={cn("px-4 py-2 text-sm font-medium transition-colors", view === "week" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted")}
          >
            This Week
          </button>
          <button
            onClick={() => setView("month")}
            className={cn("px-4 py-2 text-sm font-medium transition-colors", view === "month" ? "bg-primary text-white" : "text-muted-foreground hover:bg-muted")}
          >
            This Month
          </button>
        </div>
        <span className="text-sm text-muted-foreground flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5" /> {formatDateRange()}
        </span>
        </div>

        <div className="flex gap-2">
          <ExportCard
            allGoals={allGoals}
            allProjects={allProjects}
            allTasks={allTasks}
            weekTasks={weekTasks}
            monthTasks={monthTasks}
            weekCompletedTasks={weekCompletedTasks}
            monthCompletedTasks={monthCompletedTasks}
            categories={categories}
            view={view}
            dateRange={formatDateRange()}
            now={now}
          />
        </div>
      </div>


      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Goals */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" /> Active Goals ({activeGoals.length})
          </h3>
          <div className="space-y-2">
            {activeGoals.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active goals</p>
            ) : activeGoals.map(g => (
              <div key={g.id} className="flex items-center gap-2 text-sm py-1.5 border-b last:border-0">
                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: g.categoryColor ?? "#6366f1" }} />
                <span className="flex-1 truncate font-medium">{g.title}</span>
                {g.categoryName && (
                  <span className="text-xs text-muted-foreground">{g.categoryName}</span>
                )}
                {g.targetDate && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {new Date(g.targetDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tasks this period */}
        <div className="bg-white border rounded-2xl p-5 shadow-sm">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-blue-500" />
            {view === "week" ? "Week's" : "Month's"} Tasks ({activeTasks.length})
          </h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {activeTasks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No tasks this {view}</p>
            ) : activeTasks.map(t => (
              <div key={t.id} className="flex items-center gap-2 text-sm">
                {t.completed
                  ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                }
                <span className={cn("flex-1 truncate", t.completed && "line-through text-muted-foreground")}>{t.title}</span>
                {t.dueDate && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(t.dueDate).toLocaleDateString("en", { month: "short", day: "numeric" })}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Category breakdown */}
        {catBreakdown.length > 0 && (
          <div className="bg-white border rounded-2xl p-5 shadow-sm lg:col-span-2">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4" /> Category Breakdown
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catBreakdown.map(cat => (
                <div key={cat.id} className="border rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="font-medium text-sm">{cat.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{cat.goals} goals</span>
                  </div>
                  <ProgressBar value={cat.done} max={cat.tasks} color={cat.color} />
                  <p className="text-xs text-muted-foreground mt-1">{cat.done} / {cat.tasks} tasks done</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}