import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  title: string
  value: number | string
  icon: LucideIcon
  color: "orange" | "violet" | "blue" | "green"
}

const colorMap = {
  orange: { bg: "bg-orange-500/10", icon: "text-orange-500", value: "text-orange-600" },
  violet: { bg: "bg-violet-500/10", icon: "text-violet-500", value: "text-violet-600" },
  blue:   { bg: "bg-blue-500/10",   icon: "text-blue-500",   value: "text-blue-600"   },
  green:  { bg: "bg-emerald-500/10", icon: "text-emerald-500", value: "text-emerald-600" },
}

export function StatsCard({ title, value, icon: Icon, color }: StatsCardProps) {
  const c = colorMap[color]
  return (
    <div className="bg-white rounded-2xl border p-5 flex items-center gap-4 shadow-sm">
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", c.bg)}>
        <Icon className={cn("w-6 h-6", c.icon)} />
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className={cn("text-2xl font-bold font-display", c.value)}>{value}</p>
      </div>
    </div>
  )
}
