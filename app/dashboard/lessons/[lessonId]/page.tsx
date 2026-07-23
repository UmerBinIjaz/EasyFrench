"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Link from "next/link"
import {
  ChevronRight, ChevronLeft, FileText, CheckCircle2, HelpCircle,
  Lock, PlayCircle, CheckCircle, ChevronDown, BookOpen, FileDown,
  ArrowLeft, MessageSquare, StickyNote, Menu, X, PenBox, ClipboardList,
  Loader2
} from "lucide-react"
import { VideoPlayer } from "@/components/course/VideoPlayer"
import { Button } from "@/components/ui/button"
import { ProgressBar } from "@/components/ui/progress-bar"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/providers/ToastProvider"
import {
  getLessonContentInfo,
  getPostCompletionAction,
  isLessonFullySatisfied,
  buildSubmittedExerciseLessonIds,
  buildPassedQuizLessonIds,
  isLessonLocked,
  ContentComposition,
} from "@/lib/progression"

export default function LessonPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { showToast } = useToast()

  const [lesson, setLesson] = useState<any>(null)
  const [course, setCourse] = useState<any>(null)
  const [lessonQuiz, setLessonQuiz] = useState<any>(null)
  const [lessonExercise, setLessonExercise] = useState<any>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [allLessons, setAllLessons] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"overview" | "notes" | "discussion">("overview")
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [composition, setComposition] = useState<ContentComposition>("lesson-only")
  const [exerciseSubmitted, setExerciseSubmitted] = useState(false)
  const [quizPassed, setQuizPassed] = useState(false)
  const [completing, setCompleting] = useState(false)
  const [submittedExerciseLessonIds, setSubmittedExerciseLessonIds] = useState<Set<string>>(new Set())
  const [passedQuizLessonIds, setPassedQuizLessonIds] = useState<Set<string>>(new Set())
  const [lessonExerciseMap, setLessonExerciseMap] = useState<Map<string, string>>(new Map())
  const [lessonQuizMap, setLessonQuizMap] = useState<Map<string, string>>(new Map())

  // Close sidebar on route change
  useEffect(() => { setSidebarOpen(false) }, [params.lessonId])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.classList.add('sidebar-open')
    } else {
      document.body.classList.remove('sidebar-open')
    }
    return () => document.body.classList.remove('sidebar-open')
  }, [sidebarOpen])

  useEffect(() => {
    async function fetchData() {
      if (!session) return
      try {
        const [lessonRes, progressRes, enrollRes, exerciseSubRes, quizRes] = await Promise.all([
          fetch(`/api/lessons/${params.lessonId}`),
          fetch("/api/progress"),
          fetch(`/api/enrollments?studentId=${session.user.id}`),
          fetch("/api/exercises/student"),
          fetch("/api/quiz-results"),
        ])
        if (!lessonRes.ok) throw new Error("Lesson not found")
        const foundLesson = await lessonRes.json()
        const pData = await progressRes.json()
        const enrollments = await enrollRes.json()
        const exerciseData = await exerciseSubRes.json()
        const quizResults = await quizRes.json()
        const foundCourse = foundLesson.course

        if (foundLesson && foundCourse) {
          setLesson(foundLesson)
          setCourse(foundCourse)
          const lessons = foundCourse.lessons || []
          setAllLessons(lessons)

          // Build exercise/quiz maps for ALL lessons (for sidebar lock logic)
          const exMap = new Map<string, string>()
          const qMap = new Map<string, string>()
          for (const l of lessons) {
            if (l.exercises?.length > 0) exMap.set(l.id, l.exercises[0].id)
            if (l.quizzes?.length > 0) {
              const actualQuiz = l.quizzes.find((q: any) => q.type === "QUIZ" || !q.type)
              if (actualQuiz) qMap.set(l.id, actualQuiz.id)
            }
          }
          setLessonExerciseMap(exMap)
          setLessonQuizMap(qMap)

          // Set current lesson's exercise and quiz
          if (foundLesson.exercises?.length > 0) {
            setLessonExercise(foundLesson.exercises[0])
          }
          if (foundLesson.quizzes?.length > 0) {
            const quiz = foundLesson.quizzes.find((q: any) => q.type === "QUIZ" || !q.type)
            if (quiz) setLessonQuiz(quiz)
          }

          // Set composition
          setComposition(getLessonContentInfo(foundLesson).composition)

          // Progress tracking
          const doneIds = new Set<string>(pData.filter((p: any) => p.completed).map((p: any) => p.lessonId))
          setCompletedIds(doneIds)

          const progress = pData.find((p: any) => p.lessonId === params.lessonId)
          if (progress?.completed) setIsCompleted(true)

          // Exercise submission tracking
          const submittedExIds = new Set<string>()
          if (Array.isArray(exerciseData)) {
            exerciseData.forEach((s: any) => submittedExIds.add(s.exerciseId))
          } else if (exerciseData?.submissions) {
            exerciseData.submissions.forEach((s: any) => submittedExIds.add(s.exerciseId))
          }
          const subExLessonIds = buildSubmittedExerciseLessonIds(exMap, submittedExIds)
          setSubmittedExerciseLessonIds(subExLessonIds)

          // Check if current lesson's exercise is submitted
          if (foundLesson.exercises?.length > 0) {
            const exId = foundLesson.exercises[0].id
            if (submittedExIds.has(exId)) {
              setExerciseSubmitted(true)
            }
          }

          // Quiz result tracking
          const passedQIds = new Set<string>()
          quizResults.forEach((r: any) => {
            if (r.passed) passedQIds.add(r.quizId)
          })
          const passedQLessonIds = buildPassedQuizLessonIds(qMap, passedQIds)
          setPassedQuizLessonIds(passedQLessonIds)

          // Check if current lesson's quiz is passed
          if (foundLesson.quizzes?.length > 0) {
            const quiz = foundLesson.quizzes.find((q: any) => q.type === "QUIZ" || !q.type)
            if (quiz && passedQIds.has(quiz.id)) {
              setQuizPassed(true)
            }
          }

          // Lock check: lesson is locked if previous lesson is not fully satisfied
          const isEnrolled = enrollments.some((e: any) => e.courseId === foundCourse.id)
          const locked = !isEnrolled
            ? lessons.findIndex((l: any) => l.id === foundLesson.id) > 0
            : isLessonLocked(lessons, foundLesson.id, doneIds, subExLessonIds, passedQLessonIds)
          if (locked) {
            router.push(`/dashboard/courses/${foundCourse.id}`)
          }
        }
      } catch (error) {
        console.error("Error loading lesson", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [params.lessonId, session, router])

  const handleCompleteLesson = useCallback(async () => {
    setCompleting(true)
    try {
      const res = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lessonId: params.lessonId, timeSpent: 300, completed: true })
      })
      const data = await res.json()
      if (res.ok) {
        setIsCompleted(true)
        setCompletedIds(prev => new Set(prev).add(params.lessonId as string))
        showToast("Lesson marked as completed!", "success")

        // Determine next action based on composition
        const info = getLessonContentInfo(lesson)
        if (info.hasExercise) {
          // Small delay so the toast shows, then redirect
          setTimeout(() => {
            router.push(`/dashboard/exercises/${info.exerciseId}`)
          }, 800)
        } else if (info.hasQuiz) {
          // Quiz only — redirect to quiz
          setTimeout(() => {
            router.push(`/dashboard/quizzes/${info.quizId}?lessonId=${params.lessonId}&courseId=${course?.id}`)
          }, 800)
        } else {
          // Lesson only — no redirect, just UI update
          // The next lesson becomes unlocked automatically
        }
      } else {
        showToast(data.error || "Failed to mark lesson as complete.")
      }
    } catch (error) {
      showToast("Error marking lesson complete. Please try again.")
    } finally {
      setCompleting(false)
    }
  }, [params.lessonId, lesson, router, showToast])

  const isFullySatisfied = isLessonFullySatisfied(
    lesson || {},
    isCompleted,
    exerciseSubmitted,
    quizPassed,
  )

  if (loading) return (
    <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-64px)]">
      <div className="hidden lg:block lg:w-64 bg-white border-r border-gray-200 animate-pulse min-h-[300px]" />
      <div className="flex-1 flex items-center justify-center text-sm text-gray-400 min-h-[300px]">Loading lesson…</div>
    </div>
  )
  if (!lesson) return <div className="text-gray-500 text-sm text-center py-12">Lesson not found.</div>

  const currentIdx = allLessons.findIndex((l: any) => l.id === lesson.id)
  const prevLesson = currentIdx > 0 ? allLessons[currentIdx - 1] : null
  const nextLesson = currentIdx < allLessons.length - 1 ? allLessons[currentIdx + 1] : null

  const totalLessons = allLessons.length
  const completedCount = completedIds.size
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  /** Renders the completion status banner for each scenario */
  const renderCompletionBanner = () => {
    if (!isCompleted) return null

    if (composition === "lesson-only") {
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-[#2e7d32] bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl py-3 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Lesson completed! You can proceed to the next lesson.
        </div>
      )
    }

    if (composition === "quiz-only") {
      if (!quizPassed) {
        return (
          <div className="flex items-center justify-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-xl py-3 font-semibold">
            <HelpCircle className="w-4 h-4" /> Lesson complete! Take the quiz to unlock the next lesson.
          </div>
        )
      }
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-[#2e7d32] bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl py-3 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Quiz passed! Next lesson is now unlocked.
        </div>
      )
    }

    if (composition === "exercise-only") {
      if (!exerciseSubmitted) {
        return (
          <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-3 font-semibold">
            <ClipboardList className="w-4 h-4" /> Lesson complete! Solve the exercise to unlock the next lesson.
          </div>
        )
      }
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-[#2e7d32] bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl py-3 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> Exercise submitted! Next lesson is now unlocked.
        </div>
      )
    }

    if (composition === "exercise-quiz") {
      if (!exerciseSubmitted) {
        return (
          <div className="flex items-center justify-center gap-2 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl py-3 font-semibold">
            <ClipboardList className="w-4 h-4" /> Lesson complete! Step 1: Solve the exercise.
          </div>
        )
      }
      if (!quizPassed) {
        return (
          <div className="flex items-center justify-center gap-2 text-sm text-purple-700 bg-purple-50 border border-purple-200 rounded-xl py-3 font-semibold">
            <HelpCircle className="w-4 h-4" /> Exercise submitted! Step 2: Take the quiz to unlock the next lesson.
          </div>
        )
      }
      return (
        <div className="flex items-center justify-center gap-2 text-sm text-[#2e7d32] bg-[#e8f5e9] border border-[#c8e6c9] rounded-xl py-3 font-semibold">
          <CheckCircle2 className="w-4 h-4" /> All requirements completed! Next lesson is unlocked.
        </div>
      )
    }
  }

  /** Renders the bottom navigation buttons based on progression state */
  const renderBottomNav = () => {
    const leftButton = prevLesson ? (
      <Button variant="outline" className="flex items-center gap-1.5 text-xs"
        onClick={() => router.push(`/dashboard/lessons/${prevLesson.id}`)}>
        <ChevronLeft className="w-4 h-4" />
        <span className="hidden sm:inline truncate max-w-[180px]">{prevLesson.title}</span>
        <span className="sm:hidden">Previous</span>
      </Button>
    ) : <div />

    const rightButton = (() => {
      // Not completed yet → show Mark as Complete
      if (!isCompleted) {
        return (
          <Button onClick={handleCompleteLesson} variant="accent" className="gap-2" disabled={completing}>
            {completing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Marking as complete…
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" /> Mark as Complete
              </>
            )}
          </Button>
        )
      }

      // COMPLETED — determine next step based on scenario
      if (composition === "lesson-only") {
        if (nextLesson) {
          return (
            <Button className="flex items-center gap-1.5 text-xs"
              onClick={() => router.push(`/dashboard/lessons/${nextLesson.id}`)}>
              <span className="hidden sm:inline truncate max-w-[180px]">{nextLesson.title}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )
        }
        return (
          <Button variant="outline" className="flex items-center gap-1.5 text-xs"
            onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
            Back to Course <ChevronRight className="w-4 h-4" />
          </Button>
        )
      }

      if (composition === "exercise-only") {
        if (!exerciseSubmitted) {
          return (
            <Button className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => router.push(`/dashboard/exercises/${lessonExercise.id}`)}>
              <PenBox className="w-4 h-4" /> Solve Exercise
            </Button>
          )
        }
        // Exercise submitted — next lesson or back to course
        if (nextLesson) {
          return (
            <Button className="flex items-center gap-1.5 text-xs"
              onClick={() => router.push(`/dashboard/lessons/${nextLesson.id}`)}>
              <span className="hidden sm:inline truncate max-w-[180px]">{nextLesson.title}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )
        }
        return (
          <Button variant="outline" className="flex items-center gap-1.5 text-xs"
            onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
            Back to Course <ChevronRight className="w-4 h-4" />
          </Button>
        )
      }

      if (composition === "quiz-only") {
        if (!quizPassed) {
          return (
            <Button className="flex items-center gap-1.5 text-xs bg-[#6a1b9a] hover:bg-[#7b1fa2] text-white"
              onClick={() => router.push(`/dashboard/quizzes/${lessonQuiz.id}?lessonId=${params.lessonId}&courseId=${course.id}`)}>
              <HelpCircle className="w-4 h-4" /> Take Quiz
            </Button>
          )
        }
        // Quiz passed — next lesson or back to course
        if (nextLesson) {
          return (
            <Button className="flex items-center gap-1.5 text-xs"
              onClick={() => router.push(`/dashboard/lessons/${nextLesson.id}`)}>
              <span className="hidden sm:inline truncate max-w-[180px]">{nextLesson.title}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )
        }
        return (
          <Button variant="outline" className="flex items-center gap-1.5 text-xs"
            onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
            Back to Course <ChevronRight className="w-4 h-4" />
          </Button>
        )
      }

      if (composition === "exercise-quiz") {
        if (!exerciseSubmitted) {
          return (
            <Button className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => router.push(`/dashboard/exercises/${lessonExercise.id}`)}>
              <PenBox className="w-4 h-4" /> Solve Exercise
            </Button>
          )
        }
        if (!quizPassed) {
          return (
            <Button className="flex items-center gap-1.5 text-xs bg-[#6a1b9a] hover:bg-[#7b1fa2] text-white"
              onClick={() => router.push(`/dashboard/quizzes/${lessonQuiz.id}?lessonId=${params.lessonId}&courseId=${course.id}`)}>
              <HelpCircle className="w-4 h-4" /> Take Quiz
            </Button>
          )
        }
        // Everything done
        if (nextLesson) {
          return (
            <Button className="flex items-center gap-1.5 text-xs"
              onClick={() => router.push(`/dashboard/lessons/${nextLesson.id}`)}>
              <span className="hidden sm:inline truncate max-w-[180px]">{nextLesson.title}</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          )
        }
        return (
          <Button variant="outline" className="flex items-center gap-1.5 text-xs"
            onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
            Back to Course <ChevronRight className="w-4 h-4" />
          </Button>
        )
      }

      // Fallback
      if (nextLesson) {
        return (
          <Button className="flex items-center gap-1.5 text-xs"
            onClick={() => router.push(`/dashboard/lessons/${nextLesson.id}`)}>
            Next Lesson <ChevronRight className="w-4 h-4" />
          </Button>
        )
      }
      return (
        <Button variant="outline" className="flex items-center gap-1.5 text-xs"
          onClick={() => router.push(`/dashboard/courses/${course.id}`)}>
          Back to Course <ChevronRight className="w-4 h-4" />
        </Button>
      )
    })()

    return (
      <div className="flex items-center justify-between pt-2 border-t border-gray-200 gap-3">
        {leftButton}
        {rightButton}
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row bg-[#f4f6fa] -mx-4 sm:-mx-6 md:-mx-8 min-h-[calc(100vh-64px)]">

      {/* Mobile sidebar toggle button */}
      <div className="lg:hidden sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-2.5 flex items-center gap-2">
        <button
          onClick={() => setSidebarOpen(true)}
          className="touch-target flex items-center gap-1.5 text-xs font-semibold text-[#1a237e] hover:text-[#283593] transition-colors"
          aria-label="Open lesson navigation"
        >
          <Menu className="w-4 h-4" />
          <span>Lessons</span>
        </button>
        <span className="text-[10px] text-gray-400 font-medium ml-auto truncate">{lesson.title}</span>
      </div>

      {/* ── OVERLAY (mobile) ── */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── LEFT SIDEBAR ── */}
      <aside className={cn(
        "bg-white border-r border-gray-200 flex flex-col shrink-0 overflow-hidden",
        "lg:w-64 lg:flex",
        "fixed inset-y-0 left-0 z-50 w-[280px] transition-transform duration-300 ease-in-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full",
        "lg:static lg:translate-x-0 lg:z-auto"
      )}>
        {/* Close button (mobile) */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2 lg:hidden">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Course Content</span>
          <button
            onClick={() => setSidebarOpen(false)}
            className="touch-target p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close lesson navigation"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Course title + progress */}
        <div className="px-4 pt-2 lg:pt-4 pb-3 border-b border-gray-100">
          <Link href={`/dashboard/courses/${course.id}`}
            className="flex items-center gap-1.5 text-[#1a237e] text-xs font-semibold mb-3 hover:text-[#283593] transition-colors touch-target">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Course
          </Link>
          <h2 className="text-xs font-black text-gray-900 mb-0.5 leading-snug line-clamp-2">{course.title}</h2>
          <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5 font-medium">
            <span>Progress: {progressPercent}%</span>
            <span>{completedCount}/{totalLessons} Lessons</span>
          </div>
          <ProgressBar value={progressPercent} />
        </div>

        {/* Lesson tree */}
        <nav className="flex-1 overflow-y-auto py-2">
          <div className="px-3 py-2 text-[10px] font-black text-gray-500 uppercase tracking-wider">Lessons</div>
          {allLessons.map((l: any, lIdx: number) => {
            const isCurrent = l.id === lesson.id

            // Determine lesson lock state based on full satisfaction of previous lesson
            const lessonLocked = isLessonLocked(
              allLessons,
              l.id,
              completedIds,
              submittedExerciseLessonIds,
              passedQuizLessonIds,
            )
            const isDone = completedIds.has(l.id)
            const isFullySat = isLessonFullySatisfied(
              l,
              isDone,
              submittedExerciseLessonIds.has(l.id),
              passedQuizLessonIds.has(l.id),
            )
            // The "next up" lesson is the first one not fully satisfied
            const firstNotSatisfied = allLessons.findIndex(
              (al: any) => !isLessonFullySatisfied(
                al,
                completedIds.has(al.id),
                submittedExerciseLessonIds.has(al.id),
                passedQuizLessonIds.has(al.id),
              )
            )
            const isNextUp = allLessons.findIndex((al: any) => al.id === l.id) === firstNotSatisfied

            return (
              <button
                key={l.id}
                onClick={() => {
                  if (!lessonLocked) {
                    router.push(`/dashboard/lessons/${l.id}`)
                    setSidebarOpen(false)
                  }
                }}
                disabled={lessonLocked}
                className={cn(
                  "w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors touch-target",
                  isCurrent
                    ? "bg-[#e8eaf6] border-l-2 border-[#1a237e]"
                    : "hover:bg-gray-50 border-l-2 border-transparent",
                  lessonLocked && "opacity-40 cursor-not-allowed",
                  !isDone && !isNextUp && !isCurrent && !lessonLocked && "opacity-60"
                )}
              >
                <div className="shrink-0">
                  {isFullySat ? (
                    <CheckCircle className="w-3.5 h-3.5 text-[#2e7d32]" />
                  ) : isCurrent || isNextUp ? (
                    <PlayCircle className="w-3.5 h-3.5 text-[#1a237e]" />
                  ) : (
                    <Lock className="w-3 h-3 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "text-[11px] font-semibold truncate leading-tight",
                    isCurrent ? "text-[#1a237e] font-bold" : isFullySat ? "text-gray-500" : "text-gray-700"
                  )}>
                    {l.title}
                  </div>
                  {isCurrent && (
                    <div className="text-[9px] text-[#1a237e] font-bold uppercase tracking-wide mt-0.5">Current</div>
                  )}
                  {!isFullySat && isDone && l.id !== lesson.id && (
                    <div className="text-[8px] text-amber-600 font-bold uppercase tracking-wide mt-0.5">
                      {submittedExerciseLessonIds.has(l.id) && !passedQuizLessonIds.has(l.id) ? "Quiz needed" : "Exercise needed"}
                    </div>
                  )}
                </div>
              </button>
            )
          })}
        </nav>

        {/* Help Center */}
        <div className="border-t border-gray-100 px-4 py-3">
          <a href="#" className="flex items-center gap-2 text-xs text-gray-500 hover:text-gray-800 transition-colors touch-target">
            <BookOpen className="w-3.5 h-3.5" /> Help Center
          </a>
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden min-w-0">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-5">

          {/* Video */}
          {lesson.videoUrl && (
            <div className="rounded-xl overflow-hidden shadow-md bg-black">
              <VideoPlayer url={lesson.videoUrl} onComplete={() => { if (!isCompleted) handleCompleteLesson() }} />
            </div>
          )}

          {/* Lesson info + actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black text-gray-900 mb-1">{lesson.title}</h1>
                <p className="text-[11px] sm:text-xs text-gray-500 font-medium">
                  {"Lesson "}{currentIdx + 1}{" • "}{lesson.duration ?? "8 minutes"}
                </p>
                {/* Composition badge */}
                <span className={cn(
                  "inline-block mt-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full",
                  composition === "lesson-only" && "bg-gray-100 text-gray-600",
                  composition === "quiz-only" && "bg-purple-50 text-purple-700 border border-purple-200",
                  composition === "exercise-only" && "bg-emerald-50 text-emerald-700 border border-emerald-200",
                  composition === "exercise-quiz" && "bg-purple-50 text-purple-700 border border-purple-200",
                )}>
                  {composition === "lesson-only" && "Lesson only"}
                  {composition === "quiz-only" && "Includes quiz"}
                  {composition === "exercise-only" && "Includes exercise"}
                  {composition === "exercise-quiz" && "Includes exercise + quiz"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {lesson.pdfUrl && (
                  <a href={lesson.pdfUrl} target="_blank" rel="noreferrer"
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-[11px] sm:text-xs font-semibold border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors touch-target">
                    <FileDown className="w-3.5 h-3.5" /> Resources
                  </a>
                )}
                {/* Show exercise shortcut (only if lesson is completed) */}
                {lessonExercise && isCompleted && !exerciseSubmitted && (
                  <button
                    onClick={() => router.push(`/dashboard/exercises/${lessonExercise.id}`)}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm touch-target">
                    <PenBox className="w-3.5 h-3.5" /> Solve Exercise
                  </button>
                )}
                {/* Show quiz shortcut (for quiz-only or after exercise submitted in exercise-quiz) */}
                {lessonQuiz && isCompleted && !quizPassed && (composition === "quiz-only" || exerciseSubmitted) && (
                  <button
                    onClick={() => router.push(`/dashboard/quizzes/${lessonQuiz.id}?lessonId=${params.lessonId}&courseId=${course.id}`)}
                    className="flex items-center gap-1.5 px-3 sm:px-4 py-2 text-[11px] sm:text-xs font-bold bg-[#6a1b9a] text-white rounded-lg hover:bg-[#7b1fa2] transition-colors shadow-sm touch-target">
                    <HelpCircle className="w-3.5 h-3.5" /> Take Quiz
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Progression status card */}
          {isCompleted && (composition === "quiz-only" || composition === "exercise-only" || composition === "exercise-quiz") && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Progression Status</h3>
              <div className="space-y-2.5">
                {/* Lesson step */}
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Lesson completed</p>
                    <p className="text-[10px] text-gray-400">You've finished this lesson</p>
                  </div>
                </div>
                {/* Exercise step (not shown for quiz-only) */}
                {composition !== "quiz-only" && (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                      exerciseSubmitted
                        ? "bg-emerald-100 border border-emerald-300"
                        : "bg-amber-50 border-2 border-dashed border-amber-300"
                    )}>
                      {exerciseSubmitted ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600">!</span>
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-semibold",
                        exerciseSubmitted ? "text-gray-500 line-through" : "text-amber-700"
                      )}>
                        {composition === "exercise-quiz" ? "Exercise (Step 1 of 2)" : "Exercise"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {exerciseSubmitted ? "Submitted" : "Not yet completed"}
                      </p>
                    </div>
                  </div>
                )}
                {/* Quiz step (for quiz-only or exercise-quiz) */}
                {(composition === "quiz-only" || composition === "exercise-quiz") && (
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center shrink-0",
                      quizPassed
                        ? "bg-emerald-100 border border-emerald-300"
                        : composition === "quiz-only"
                          ? "bg-amber-50 border-2 border-dashed border-amber-300"
                          : !exerciseSubmitted
                            ? "bg-gray-100 border border-dashed border-gray-300"
                            : "bg-amber-50 border-2 border-dashed border-amber-300"
                    )}>
                      {quizPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      ) : composition === "quiz-only" ? (
                        <span className="text-[9px] font-bold text-amber-600">!</span>
                      ) : !exerciseSubmitted ? (
                        <Lock className="w-3 h-3 text-gray-400" />
                      ) : (
                        <span className="text-[9px] font-bold text-amber-600">!</span>
                      )}
                    </div>
                    <div>
                      <p className={cn(
                        "text-xs font-semibold",
                        quizPassed ? "text-gray-500 line-through" : composition === "quiz-only" ? "text-purple-700" : !exerciseSubmitted ? "text-gray-400" : "text-purple-700"
                      )}>
                        {composition === "quiz-only" ? "Quiz" : "Quiz (Step 2 of 2)"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {quizPassed ? "Passed" : composition === "quiz-only" ? "Not yet passed" : !exerciseSubmitted ? "Complete the exercise first" : "Not yet passed"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── REVIEW SECTION: Exercise + Quiz results ── */}
          {(exerciseSubmitted || quizPassed) && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Review Your Work</h3>
              <div className="space-y-2.5">
                {exerciseSubmitted && lessonExercise && (
                  <Link
                    href={`/dashboard/exercises/${lessonExercise.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <FileText className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-emerald-700 transition-colors">
                        {lessonExercise.title || "Exercise"}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        View submitted answers & teacher feedback
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-emerald-500 transition-colors shrink-0" />
                  </Link>
                )}
                {quizPassed && lessonQuiz && (
                  <Link
                    href={`/dashboard/quizzes/${lessonQuiz.id}?lessonId=${params.lessonId}&courseId=${course.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/30 transition-colors group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                      <HelpCircle className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-900 group-hover:text-purple-700 transition-colors">
                        {lessonQuiz.title || "Quiz"} Result
                      </p>
                      <p className="text-[10px] text-gray-400">View your quiz score and answers</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-purple-500 transition-colors shrink-0" />
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex border-b border-gray-100 overflow-x-auto">
              {(["overview", "notes", "discussion"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 sm:px-5 py-3 text-[11px] sm:text-xs font-semibold capitalize transition-colors border-b-2 shrink-0 touch-target",
                    activeTab === tab
                      ? "border-[#1a237e] text-[#1a237e]"
                      : "border-transparent text-gray-500 hover:text-gray-800"
                  )}
                >
                  {tab === "overview" && <BookOpen className="w-3.5 h-3.5" />}
                  {tab === "notes" && <StickyNote className="w-3.5 h-3.5" />}
                  {tab === "discussion" && <MessageSquare className="w-3.5 h-3.5" />}
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="p-4 sm:p-5">
              {activeTab === "overview" && (
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 mb-3">What you'll learn</h3>
                  <div
                    className="prose prose-sm max-w-none text-gray-600 text-justify [&_h1]:text-gray-900 [&_h2]:text-gray-900 [&_h3]:text-gray-900 [&_strong]:text-gray-800 [&_img]:max-w-full [&_img]:h-auto [&_table]:display-block [&_table]:overflow-x-auto [&_pre]:overflow-x-auto"
                    dangerouslySetInnerHTML={{
                      __html: (lesson.textContent || lesson.description || "")
                        .replace(/&nbsp;/g, " ")
                        .replace(/\u00a0/g, " ")
                    }}
                  />
                </div>
              )}
              {activeTab === "notes" && (
                <div className="text-center py-8 text-sm text-gray-400">
                  <StickyNote className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Notes feature coming soon.
                </div>
              )}
              {activeTab === "discussion" && (
                <div className="text-center py-8 text-sm text-gray-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  Discussion coming soon.
                </div>
              )}
            </div>
          </div>

          {/* Completion banner */}
          {renderCompletionBanner()}

          {/* Bottom navigation */}
          {renderBottomNav()}
        </div>
      </div>
    </div>
  )
}
