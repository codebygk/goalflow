"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import {
  Target, FolderKanban, CheckSquare, LogOut, Menu, X, Tag,
  BarChart2, Calendar, Inbox, Sun, CalendarDays, CalendarRange,
  Clock, Trash2, ChevronDown,
} from "lucide-react"
import Image from "next/image"

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
}

interface NavGroup {
  label: string
  items: NavItem[]
  defaultOpen?: boolean
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: "Workspace",
    defaultOpen: true,
    items: [
      { href: "/overview", label: "Overview",  icon: BarChart2 },
      { href: "/inbox",    label: "Inbox",     icon: Inbox },
    ],
  },
  {
    label: "Plan",
    defaultOpen: true,
    items: [
      { href: "/goals",    label: "Goals",    icon: Target },
      { href: "/projects", label: "Projects", icon: FolderKanban },
      { href: "/tasks",    label: "Tasks",    icon: CheckSquare },
    ],
  },
  {
    label: "Schedule",
    defaultOpen: true,
    items: [
      { href: "/today",     label: "Today",     icon: Sun },
      { href: "/tomorrow",  label: "Tomorrow",  icon: CalendarDays },
      { href: "/this-week", label: "This Week", icon: CalendarRange },
      { href: "/later",     label: "Later",     icon: Clock },
    ],
  },
  {
    label: "Manage",
    defaultOpen: true,
    items: [
      { href: "/categories", label: "Categories", icon: Tag },
      { href: "/trash",      label: "Trash",       icon: Trash2 },
    ],
  },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

function NavGroup({ group, pathname, onNavigate }: {
  group: NavGroup
  pathname: string
  onNavigate: () => void
}) {
  const [open, setOpen] = useState(group.defaultOpen ?? true)

  const isGroupActive = group.items.some(item =>
    pathname === item.href || pathname.startsWith(item.href + "/")
  )

  // Auto-open if a child is active
  const [initialized, setInitialized] = useState(false)
  if (!initialized && isGroupActive && !open) {
    setOpen(true)
    setInitialized(true)
  }

  return (
    <div>
      {/* Group header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-1.5 mb-0.5 group"
      >
        <span className={cn(
          "text-[10px] font-semibold uppercase tracking-widest transition-colors",
          isGroupActive ? "text-primary" : "text-muted-foreground/60 group-hover:text-muted-foreground"
        )}>
          {group.label}
        </span>
        <ChevronDown className={cn(
          "w-4 h-4 text-muted-foreground/40 transition-transform duration-200",
          open ? "rotate-0" : "-rotate-90"
        )} />
      </button>

      {/* Items */}
      {open && (
        <div className="space-y-0.5 mb-3">
          {group.items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/tasks" && pathname.startsWith(href + "/"))
            const tasksActive = href === "/tasks" && (pathname === "/tasks" || pathname.startsWith("/tasks/"))
            const isActive = active || tasksActive

            return (
              <Link
                key={href}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("w-4 h-4 shrink-0", isActive ? "text-primary" : "")} />
                {label}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center px-6 py-5 border-b shrink-0">
        <Image src="/logo.svg" alt="GoalSeed Logo" width={32} height={32} className="inline-block mr-2" />
        <div className="flex flex-col items-start">
          <span className="font-display text-xl font-bold text-foreground">GoalSeed</span>
          <p className="text-xs text-muted-foreground mt-0.5">Growing future with goals.</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin scrollbar-thumb-rounded scrollbar-thumb-muted">
        {NAV_GROUPS.map(group => (
          <NavGroup
            key={group.label}
            group={group}
            pathname={pathname}
            onNavigate={() => setMobileOpen(false)}
          />
        ))}
      </nav>

      {/* User row */}
      <div className="px-3 py-4 border-t shrink-0">
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate leading-tight">{user.name ?? "User"}</p>
            <p className="text-xs text-muted-foreground truncate leading-tight">{user.email}</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            title="Sign out"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-white border-r flex-col z-40">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center justify-between px-4 z-40">
        <span className="font-display text-xl font-bold">GoalSeed</span>
        <button
          onClick={() => setMobileOpen(o => !o)}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-xl">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}