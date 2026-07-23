"use client"

import Link from "next/link"
import { PlayCircle, CheckCircle2, Lock } from "lucide-react"
import { cn, formatDuration } from "@/lib/utils"

interface LessonItemProps {
  lesson: any
  courseId: string
  isCompleted: boolean
  isLocked: boolean
  isActive?: boolean
}

export function LessonItem({ lesson, courseId, isCompleted, isLocked, isActive }: LessonItemProps) {
  const content = (
    <div className={cn(
      "flex items-center justify-between p-2 sm:p-3 rounded-xl transition-all border border-transparent touch-target",
      isActive ? "bg-blue-500/10 border-blue-500/25" : isLocked ? "opacity-45" : "hover:bg-white/5 bg-transparent my-1"
    )}>
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          ) : isLocked ? (
            <Lock className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
          ) : (
            <PlayCircle className={cn("w-4 h-4 sm:w-5 sm:h-5", isActive ? "text-blue-400" : "text-gray-500")} />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h5 className={cn(
            "text-xs sm:text-sm font-medium truncate",
            isActive ? "text-blue-400 font-bold" : isLocked ? "text-gray-500" : "text-gray-900"
          )}>
            {lesson.title}
          </h5>
          {lesson.duration && (
            <div className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
              {formatDuration(lesson.duration)}
            </div>
          )}
        </div>
      </div>
    </div>
  )

  if (isLocked) {
    return content
  }

  return (
    <Link href={`/dashboard/lessons/${lesson.id}`} className="block">
      {content}
    </Link>
  )
}
