"use client"

import { signOut, useSession } from "next-auth/react"
import { LogOut } from "lucide-react"

export function TopBar() {
  const { data: session } = useSession()

  return (
    <div className="h-16 border-b border-gray-200 bg-white flex items-center justify-end px-4 sm:px-6 sticky top-0 z-30"
      style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>

      {/* Right section - User */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {session?.user && (
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1a237e] flex items-center justify-center text-white text-xs font-bold shrink-0">
              {session.user.name?.charAt(0) ?? "U"}
            </div>
            <div className="hidden sm:block">
              <div className="text-xs font-semibold text-gray-900 leading-none">{session.user.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 capitalize font-medium">
                {session.user.role?.toLowerCase() ?? "student"}
              </div>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="ml-0.5 sm:ml-1 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors touch-target"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
