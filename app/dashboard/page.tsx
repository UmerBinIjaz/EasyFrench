import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { CircularProgress } from "@/components/charts/CircularProgress"
import { WeeklyActivityChart } from "@/components/charts/WeeklyActivityChart"
import { BookOpen, Flame, Trophy, PlayCircle, ArrowRight, Sparkles, Award } from "lucide-react"
import Link from "next/link"

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  const userId = session.user.id

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      enrollments: { include: { course: true } }
    }
  })

  const wordOfDay = await prisma.wordOfDay.findFirst({ orderBy: { date: "desc" } })

  const activeEnrollment = user?.enrollments.find((e) => e.status === "ACTIVE")

  // ===== STREAK CALCULATION =====
  // Gather all distinct dates where the user completed an activity
  const completedProgress = await prisma.progress.findMany({
    where: { studentId: userId, completed: true, completedAt: { not: null } },
    select: { completedAt: true }
  })

  const quizResults = await prisma.quizResult.findMany({
    where: { studentId: userId },
    select: { completedAt: true }
  })

  const activityDates = new Set<string>()
  completedProgress.forEach((p) => {
    if (p.completedAt) activityDates.add(p.completedAt!.toISOString().split("T")[0])
  })
  quizResults.forEach((q) => {
    activityDates.add(q.completedAt.toISOString().split("T")[0])
  })

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  let streak = 0
  const cursor = new Date(today)

  while (true) {
    const dateStr = cursor.toISOString().split("T")[0]
    if (activityDates.has(dateStr)) {
      streak++
      cursor.setDate(cursor.getDate() - 1)
    } else {
      break
    }
  }

  // ===== XP CALCULATION =====
  const completedLessonCount = await prisma.progress.count({
    where: { studentId: userId, completed: true }
  })

  const allQuizResults = await prisma.quizResult.findMany({
    where: { studentId: userId }
  })

  const lessonXP = completedLessonCount * 10
  const quizXP = allQuizResults.reduce((sum, qr) => sum + (qr.passed ? qr.score : 0), 0)
  const totalXP = lessonXP + quizXP

  // ===== CURRENT PROGRESS (active enrollment) =====
  let courseTitle = ""
  let moduleTitle = ""
  let overallProgress = 0
  let completedLessonsCount = 0
  let totalLessonsCount = 0
  let totalTimeSpentSeconds = 0

  if (activeEnrollment) {
    const course = await prisma.course.findUnique({
      where: { id: activeEnrollment.courseId },
      include: {
        lessons: true
      }
    })

    if (course) {
      courseTitle = course.title
      totalLessonsCount = course.lessons.length

      const courseProgress = await prisma.progress.findMany({
        where: {
          studentId: userId,
          lessonId: { in: course.lessons.map((l) => l.id) }
        }
      })

      completedLessonsCount = courseProgress.filter((p) => p.completed).length
      totalTimeSpentSeconds = courseProgress.reduce((sum, p) => sum + p.timeSpent, 0)

      overallProgress =
        totalLessonsCount > 0
          ? Math.round((completedLessonsCount / totalLessonsCount) * 100)
          : 0
    }
  }

  // ===== WEEKLY ACTIVITY =====
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  const weeklyData = dayNames.map((name) => ({ name, practice: 0, lessons: 0, quizzes: 0 }))

  const sevenDaysAgo = new Date(today)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)

  // All lesson progress with activity in the last 7 days (including in-progress lessons)
  const recentProgress = await prisma.progress.findMany({
    where: {
      studentId: userId,
      updatedAt: { gte: sevenDaysAgo }
    }
  })

  recentProgress.forEach((p) => {
    // Use completedAt for lesson day mapping, updatedAt for practice time (when activity occurred)
    const lessonDayIndex = p.completedAt
      ? p.completedAt.getDay()
      : p.updatedAt.getDay()
    if (p.completed) weeklyData[lessonDayIndex].lessons++
    weeklyData[p.updatedAt.getDay()].practice += Math.round(p.timeSpent / 60)
  })

  // Quiz results in the last 7 days
  const recentQuizResults = await prisma.quizResult.findMany({
    where: {
      studentId: userId,
      completedAt: { gte: sevenDaysAgo }
    }
  })

  recentQuizResults.forEach((qr) => {
    const dayIndex = qr.completedAt.getDay()
    weeklyData[dayIndex].quizzes!++
  })

  // ===== UPCOMING QUIZZES =====
  const enrolledCourseIds = user?.enrollments.map((e) => e.courseId) || []

  const attemptedQuizIds = await prisma.quizResult.findMany({
    where: { studentId: userId },
    select: { quizId: true }
  })
  const attemptedIds = new Set(attemptedQuizIds.map((q) => q.quizId))

  const upcomingQuizzes = await prisma.quiz.findMany({
    where: {
      courseId: { in: enrolledCourseIds },
      ...(attemptedIds.size > 0 ? { id: { notIn: Array.from(attemptedIds) } } : {})
    },
    include: {
      _count: { select: { questions: true } },
      lesson: { select: { title: true } }
    },
    take: 5
  })

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="px-0">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900">Overview</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Here's what's happening with your learning journey.</p>
      </div>

      {/* Top Row - Responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Welcome card */}
        <div className="sm:col-span-2 lg:col-span-2 bg-[#1a237e] rounded-xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-4 sm:gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 bg-white/15 border border-white/20 text-white text-[10px] font-bold px-3 py-1 rounded-full mb-3 sm:mb-4 uppercase tracking-wide">
                <Sparkles className="w-3 h-3 text-yellow-300" /> Welcome back
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white mb-1.5 sm:mb-2 tracking-tight">
                Ready to continue, {user?.name?.split(" ")[0]}?
              </h2>
              <p className="text-blue-200 text-xs sm:text-sm leading-relaxed max-w-xs">
                Keep up the momentum by completing your next module.
              </p>
            </div>
            {activeEnrollment ? (
              <Link
                href={`/dashboard/courses/${activeEnrollment.courseId}`}
                className="inline-flex items-center gap-2 bg-white text-[#1a237e] px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm self-start touch-target"
              >
                <PlayCircle className="w-4 h-4 text-[#1a237e]" />
                Resume: {activeEnrollment.course.title}
              </Link>
            ) : (
              <Link
                href="/dashboard/courses"
                className="inline-flex items-center gap-2 bg-white text-[#1a237e] px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-blue-50 transition-colors shadow-sm self-start touch-target"
              >
                <BookOpen className="w-4 h-4" /> Discover Courses
              </Link>
            )}
          </div>
        </div>

        {/* Streak */}
        <Card className="p-4 sm:p-5 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#fff3e0] text-orange-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
            <Flame className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-0.5">
            {streak.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
            Day Streak
          </div>
        </Card>

        {/* XP */}
        <Card className="p-4 sm:p-5 flex flex-col justify-center items-center text-center hover:shadow-md transition-shadow group">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[#fff8e1] text-amber-500 rounded-xl flex items-center justify-center mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
            <Trophy className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-gray-900 mb-0.5">
            {totalXP.toLocaleString()}
          </div>
          <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wider">
            XP Points
          </div>
        </Card>
      </div>

      {/* Main content - Responsive grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          {/* Current Progress (only if enrolled) */}
          {activeEnrollment ? (
            <Card className="p-4 sm:p-6">
              <h3 className="text-sm font-bold text-gray-900 mb-4">Current Progress</h3>
              <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
                <div className="shrink-0">
                  <div className="bg-[#f3f4fb] rounded-full p-1.5 border border-gray-200">
                    <CircularProgress value={overallProgress} text={`${overallProgress}%`} />
                  </div>
                </div>
                <div className="flex-1 space-y-4 w-full">
                  <div>
                    <h4 className="font-black text-gray-900 text-base sm:text-lg tracking-tight mb-1">
                      {courseTitle}
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-gray-500 font-medium">
                      <span>Overall Progress</span>
                      <span className="font-bold text-gray-900">{overallProgress}%</span>
                    </div>
                    <ProgressBar value={overallProgress} />
                  </div>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                    <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg border border-gray-200">
                      <div className="text-[10px] text-gray-400 mb-0.5 font-bold uppercase tracking-wider">
                        Completed Lessons
                      </div>
                      <div className="font-black text-gray-900 text-sm sm:text-base">
                        {completedLessonsCount}{" "}
                        <span className="text-gray-400 text-xs font-normal">
                          / {totalLessonsCount}
                        </span>
                      </div>
                    </div>
                    <div className="bg-gray-50 p-2.5 sm:p-3 rounded-lg border border-gray-200">
                      <div className="text-[10px] text-gray-400 mb-0.5 font-bold uppercase tracking-wider">
                        Time Spent
                      </div>
                      <div className="font-black text-gray-900 text-sm sm:text-base">
                        {formatTime(totalTimeSpentSeconds)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Weekly Activity */}
          <Card className="p-4 sm:p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Activity Breakdown</h3>
            <div className="w-full overflow-x-auto -mx-2 px-2">
              <WeeklyActivityChart data={weeklyData} />
            </div>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4 sm:space-y-6">
          {/* Word of the Day */}
          <Card className="p-4 sm:p-5 bg-gradient-to-br from-[#f3f4fb] to-white border-[#c5cae9]">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Word of the Day</h3>
            {wordOfDay ? (
              <div>
                <div className="text-xl sm:text-2xl font-black text-[#1a237e] mb-1">{wordOfDay.word}</div>
                <div className="text-[#2e7d32] font-bold text-sm mb-3">{wordOfDay.translation}</div>
                {wordOfDay.example && (
                  <div className="bg-white p-3 rounded-lg border border-gray-200 text-xs text-gray-600 italic mb-3">
                    &ldquo;{wordOfDay.example}&rdquo;
                  </div>
                )}
                {wordOfDay.definition && (
                  <div className="text-xs text-gray-500 leading-relaxed">{wordOfDay.definition}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-400 text-sm text-center py-6">Check back later for today's word.</div>
            )}
          </Card>

          {/* Upcoming Quizzes */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-gray-900">Upcoming Quizzes</h3>
              <Link
                href="/dashboard/tests"
                className="text-xs font-semibold text-[#1a237e] hover:text-[#283593] flex items-center gap-1 group"
              >
                View all{" "}
                <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
            <div className="space-y-2">
              {upcomingQuizzes.length > 0 ? (
                upcomingQuizzes.map((quiz) => (
                  <Link key={quiz.id} href={`/dashboard/quizzes/${quiz.id}`}>
                    <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center gap-3 group">
                      <div className="w-8 h-8 sm:w-9 sm:h-9 bg-[#e8eaf6] text-[#1a237e] rounded-lg flex items-center justify-center shrink-0 group-hover:bg-[#1a237e] group-hover:text-white transition-colors">
                        <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-gray-900 text-xs sm:text-sm group-hover:text-[#1a237e] transition-colors truncate">
                          {quiz.title}
                        </h4>
                        <p className="text-[10px] sm:text-xs text-gray-400 mt-0.5">
                          {quiz._count.questions} questions
                          {quiz.timeLimit ? ` • ${quiz.timeLimit} minutes` : ""}
                        </p>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#1a237e] ml-auto shrink-0 transition-colors" />
                    </Card>
                  </Link>
                ))
              ) : (
                <Card className="p-4 text-center text-gray-400 text-xs">
                  No upcoming quizzes. Great work staying ahead!
                </Card>
              )}
            </div>
          </section>

          {/* Certificates */}
          <Card className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#fff8e1] text-amber-500 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-gray-900">My Certificates</h3>
            </div>
            <Link
              href="/dashboard/certificates"
              className="w-full text-center text-xs font-semibold py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-[#e8eaf6] hover:text-[#1a237e] hover:border-[#c5cae9] transition-all block touch-target"
            >
              View All Certificates
            </Link>
          </Card>
        </div>
      </div>
    </div>
  )
}
