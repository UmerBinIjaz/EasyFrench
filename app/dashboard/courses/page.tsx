import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { CourseCard } from "@/components/course/CourseCard"
import Link from "next/link"
import { BookOpen } from "lucide-react"

export default async function CoursesPage() {
  const session = await getServerSession(authOptions)

  if (!session) return null

  // Fetch only the courses the student is enrolled in
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        include: {
          lessons: true
        }
      }
    },
    orderBy: { enrolledAt: "desc" }
  })

  // Fetch user's completed progress
  const progressData = await prisma.progress.findMany({
    where: { studentId: session.user.id, completed: true }
  })

  return (
    <div className="space-y-6 sm:space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">My Courses</h1>
        <p className="text-sm sm:text-base text-gray-500">Continue learning from the courses you're enrolled in.</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24 px-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 sm:mb-6">
            <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">No courses yet</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 max-w-md">
            You haven't enrolled in any courses yet. Browse our course catalog to start your learning journey.
          </p>
          <Link
            href="/courses"
            className="inline-flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {enrollments.map((enrollment) => {
            const course = enrollment.course

            // Recompute progress AND completion from real data so that deleting
            // progress / quiz / exercise records correctly un-marks a course as
            // completed (the stored enrollment.status can be stale).
            const allLessons = course.lessons || []
            const totalLessons = allLessons.length
            const completedCount =
              totalLessons > 0
                ? allLessons.filter((l: any) => progressData.some((p) => p.lessonId === l.id)).length
                : 0
            const progress =
              totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0
            // A course is only "completed" when every lesson has a completed
            // progress record. This mirrors checkCourseCompletion() and stays
            // accurate even if the underlying records are deleted.
            const isActuallyCompleted =
              totalLessons > 0 && completedCount === totalLessons

            const enrollmentWithProgress = {
              ...enrollment,
              progress,
              status: isActuallyCompleted ? "COMPLETED" : enrollment.status === "COMPLETED" ? "ACTIVE" : enrollment.status,
            }

            return (
              <CourseCard
                key={course.id}
                course={course}
                enrollment={enrollmentWithProgress}
                isLocked={false}
                href={`/dashboard/courses/${course.id}`}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
