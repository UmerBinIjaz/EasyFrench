"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import {
  LayoutDashboard, BookOpen, TrendingUp,
  HelpCircle, LogOut, GraduationCap, PlayCircle, X, Menu
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useState, useEffect } from "react"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  { name: "Performance", href: "/dashboard/certificates", icon: TrendingUp },
]

export function StudentSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.classList.add("sidebar-open")
    } else {
      document.body.classList.remove("sidebar-open")
    }
    return () => document.body.classList.remove("sidebar-open")
  }, [mobileOpen])

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1a237e] rounded-lg flex items-center justify-center shrink-0">
            <GraduationCap className="text-white" style={{ width: 18, height: 18 }} />
          </div>
          <span className="text-[15px] font-bold text-[#1a237e] tracking-tight">EasyFrench</span>
        </div>
      </div>

      {/* User info */}
      {session?.user && (
        <div className="px-4 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-3 px-2 py-2.5 rounded-lg bg-[#f3f4fb]">
            <div className="w-8 h-8 rounded-full bg-[#1a237e] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {session.user.name?.charAt(0) ?? "S"}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-gray-900 truncate">{session.user.name}</div>
              <div className="text-[10px] text-gray-400 font-medium">Student</div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href))
          const Icon = item.icon
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative touch-target",
                isActive
                  ? "bg-[#e8eaf6] text-[#1a237e] font-semibold"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-[#1a237e] rounded-r-full" />
              )}
              <Icon
                className={cn(
                  "w-4 h-4 shrink-0 transition-colors",
                  isActive ? "text-[#1a237e]" : "text-gray-400 group-hover:text-gray-600"
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* Start Practice CTA */}
      <div className="px-4 pb-3 border-t border-gray-100 pt-4 shrink-0">
        <Link
          href="/dashboard/courses"
          className="flex items-center justify-center gap-2 w-full py-2.5 bg-[#2e7d32] text-white rounded-lg text-sm font-semibold hover:bg-[#388e3c] transition-colors shadow-sm touch-target"
        >
          <PlayCircle className="w-4 h-4" />
          Start Learning
        </Link>
      </div>

      {/* Bottom links */}
      <div className="px-3 pb-5 space-y-0.5 shrink-0">
        <a
          href="#"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors touch-target"
        >
          <HelpCircle className="w-4 h-4 text-gray-400" />
          Help Center
        </a>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left touch-target"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 lg:hidden bg-white border border-gray-200 rounded-lg p-2 shadow-md touch-target"
        aria-label="Open sidebar menu"
      >
        <Menu className="w-5 h-5 text-gray-700" />
      </button>

      {/* Desktop sidebar - always visible */}
      <div className="hidden lg:flex w-[260px] bg-white border-r border-gray-200 min-h-screen flex-col fixed left-0 top-0 z-40"
        style={{ boxShadow: "2px 0 8px rgba(0,0,0,0.04)" }}
      >
        {sidebarContent}
      </div>

      {/* Mobile sidebar overlay */}
      <div
        className={cn("sidebar-overlay", mobileOpen && "open")}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile sidebar drawer */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[280px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <span className="text-[15px] font-bold text-[#1a237e] tracking-tight">Menu</span>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-target"
            aria-label="Close sidebar menu"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        {sidebarContent}
      </div>
    </>
  )
}
