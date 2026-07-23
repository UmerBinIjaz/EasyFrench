import Link from "next/link"
import { CheckCircle2, Lock } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
interface CourseCardProps {
  course: any
  enrollment?: any
  isLocked?: boolean
  href: string
}

export function CourseCard({ course, enrollment, isLocked, href }: CourseCardProps) {
  const isCompleted = enrollment?.status === "COMPLETED"
  const progress = enrollment?.progress || 0 // Assuming progress is passed here

  const content = (
    <Card className={`h-full flex flex-col transition-all ${isLocked ? 'opacity-50 bg-[#0f172a]/20 border-white/5' : 'hover:border-blue-500/30 hover:bg-white/5'}`}>
      <div className="p-4 sm:p-6 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-3 sm:mb-4">
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
          ) : isLocked ? (
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500 shrink-0" />
          ) : null}
        </div>

        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 line-clamp-2">{course.title}</h3>
        <p className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6 flex-1 line-clamp-3 sm:line-clamp-none">{course.description}</p>

        {enrollment && !isCompleted && !isLocked && (
          <div className="mt-auto">
            <div className="flex justify-between text-xs font-medium text-gray-400 mb-2">
              <span>PROGRESS</span>
              <span className="text-blue-400 font-bold">{progress}%</span>
            </div>
            <ProgressBar value={progress} />
          </div>
        )}

        {isCompleted && (
          <div className="mt-auto flex justify-between items-center text-xs font-medium border-t border-white/5 pt-4 mt-4 text-gray-400">
            <span>Completed</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
        )}

        {!enrollment && !isLocked && (
          <div className="mt-auto flex justify-between items-center text-xs font-medium border-t border-white/5 pt-4 mt-4">
            <span className="text-blue-400 hover:text-blue-300 font-bold">Enroll Now</span>
          </div>
        )}
      </div>
    </Card>
  )

  if (isLocked) {
    return content
  }

  return <Link href={href} className="block h-full">{content}</Link>
}
