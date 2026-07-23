import { ReactNode } from "react"
import { TeacherSidebar } from "@/components/layout/TeacherSidebar"
import { TopBar } from "@/components/layout/TopBar"

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f4f6fa] text-gray-900 flex font-sans">
      <TeacherSidebar />
      <div className="flex-1 flex flex-col lg:pl-[260px]">
        <TopBar />
        <main className="flex-1 p-4 sm:p-6 md:p-8 w-full max-w-[1600px] mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
