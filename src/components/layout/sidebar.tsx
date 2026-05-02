"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut } from "next-auth/react"
import { cn } from "@/lib/utils"
import { Target, FolderKanban, CheckSquare, LayoutDashboard, LogOut, Sun, Menu, X } from "lucide-react"

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/my-day",    label: "My Day",    icon: Sun },
  { href: "/goals",     label: "Goals",     icon: Target },
  { href: "/projects",  label: "Projects",  icon: FolderKanban },
  { href: "/tasks",     label: "Tasks",     icon: CheckSquare },
]

interface SidebarProps {
  user: { name?: string | null; email?: string | null; image?: string | null }
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const NavContent = () => (
    <>
      {/* Logo */}
      <div className="px-6 py-5 border-b">
        <span className="font-display text-2xl font-bold text-foreground">GoalSeed</span>
        <p className="text-xs text-muted-foreground mt-0.5">Achieve more, every day</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/")
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className={cn("w-4 h-4 shrink-0", active ? "text-primary" : "")} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* User row */}
      <div className="px-3 py-4 border-t">
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
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden sm:flex fixed left-0 top-0 h-screen w-64 bg-white border-r flex-col z-40">
        <NavContent />
      </aside>

      {/* Mobile top bar */}
      <header className="sm:hidden fixed top-0 left-0 right-0 h-14 bg-white border-b flex items-center justify-between px-4 z-40 mb-10">
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
        <div className="sm:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          {/* Drawer */}
          <aside className="absolute left-0 top-0 h-full w-72 bg-white flex flex-col shadow-xl">
            <NavContent />
          </aside>
        </div>
      )}
    </>
  )
}
