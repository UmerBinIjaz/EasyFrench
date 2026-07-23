"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  HelpCircle, Dumbbell, BookOpen, ChevronRight,
  GraduationCap, Layers, ArrowRight
} from "lucide-react"
import Link from "next/link"

type QuizItem = {
  id: string
  title: string
  type: "QUIZ" | "EXERCISE"
  passMark: number
  timeLimit: number | null
  _count?: { questions: number }
  questions?: any[]
}

type CourseWithQuizzes = {
  id: string
  title: string
  level: string
  description: string
  quizzes: QuizItem[]
  modules: {
    id: string
    title: string
    quizzes: QuizItem[]
    lessons: { quizzes: QuizItem[] }[]
  }[]
}

export default function TestsPage() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithQuizzes[]>([])
  const [loading, setLoading] = useState(true)
  const [isEnrolled, setIsEnrolled] = useState(false)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [coursesRes, enrollRes] = await Promise.all([
          fetch("/api/courses/with-quizzes"),
          fetch("/api/enrollments"),
        ])
        const coursesData = await coursesRes.json()
        const enrollData = await enrollRes.json()
        setCourses(Array.isArray(coursesData) ? coursesData : [])
        setIsEnrolled(Array.isArray(enrollData) && enrollData.length > 0)
        if (Array.isArray(coursesData) && coursesData.length > 0) {
          setExpandedCourse(coursesData[0].id)
        }
      } catch {
        setCourses([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Practice Tests</h1>
          <p className="text-slate-400">Loading quizzes...</p>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  // Flatten all quizzes from a course (course-level + module-level + lesson-level), deduplicated
  function getAllQuizzes(course: CourseWithQuizzes): QuizItem[] {
    const seen = new Map<string, QuizItem>()
    course.modules.forEach(m => {
      m.lessons.forEach(l => l.quizzes?.forEach(q => { if (!seen.has(q.id)) seen.set(q.id, q) }))
      m.quizzes?.forEach(q => { if (!seen.has(q.id)) seen.set(q.id, q) })
    })
    course.quizzes?.forEach(q => { if (!seen.has(q.id)) seen.set(q.id, q) })
    return Array.from(seen.values())
  }

  const coursesWithQuizzes = courses.filter(c => getAllQuizzes(c).length > 0)

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Practice Tests</h1>
        <p className="text-sm sm:text-base text-slate-400">
          {isEnrolled
            ? "Quizzes and exercises from your enrolled courses."
            : "Browse all available quizzes — no enrollment needed to practice!"}
        </p>
        {!isEnrolled && (
          <Link
            href="/dashboard/courses"
            className="inline-flex items-center gap-1.5 text-blue-400 hover:text-blue-300 text-sm font-semibold group w-fit"
          >
            <BookOpen className="w-4 h-4" />
            Enroll in a course to access full lessons &amp; content
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      {coursesWithQuizzes.length === 0 ? (
        <div className="bg-white/5 border-2 border-dashed border-white/5 rounded-2xl p-8 sm:p-12 text-center text-gray-900">
          <div className="w-16 h-16 bg-white/5 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No Quizzes Available</h3>
          <p className="text-slate-400 max-w-md mx-auto">
            No quizzes have been created yet. Check back later.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {coursesWithQuizzes.map((course) => {
            const allQuizzes = getAllQuizzes(course)
            const isOpen = expandedCourse === course.id

            return (
              <Card key={course.id} className="overflow-hidden">
                {/* Course Header */}
                <button
                  className="w-full flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 hover:bg-white/5 transition-colors text-left touch-target"
                  onClick={() => setExpandedCourse(isOpen ? null : course.id)}
                >
                  <div className="w-10 h-10 sm:w-11 sm:h-11 bg-blue-500/10 text-blue-400 rounded-xl flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-bold text-gray-900 text-sm sm:text-lg truncate">{course.title}</h2>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 mt-0.5">{allQuizzes.length} assessment{allQuizzes.length !== 1 ? "s" : ""} available</p>
                  </div>
                  <ChevronRight className={`w-4 h-4 sm:w-5 sm:h-5 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-90" : ""}`} />
                </button>

                {/* Quiz List */}
                {isOpen && (
                  <div className="border-t border-white/5 divide-y divide-white/5">
                    {allQuizzes.map((quiz, idx) => {
                      const isExercise = quiz.type === "EXERCISE"
                      const questionCount = quiz.questions?.length ?? 0

                      return (
                        <div
                          key={quiz.id}
                          className="flex items-center gap-3 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 hover:bg-white/5 transition-colors group"
                        >
                          {/* Number */}
                          <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 border ${isExercise
                            ? "bg-orange-500/10 text-orange-400 border-orange-500/20"
                            : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            }`}>
                            {idx + 1}
                          </div>

                          {/* Title + meta */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-gray-900 truncate text-sm sm:text-base">{quiz.title}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase shrink-0 ${isExercise
                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                                }`}>
                                {isExercise ? "Exercise" : "Quiz"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {questionCount > 0 ? `${questionCount} questions · Pass: ${quiz.passMark}%` : "No questions yet"}
                              {quiz.timeLimit ? ` · ${quiz.timeLimit} min` : ""}
                            </p>
                          </div>

                          {/* Start button */}
                          {questionCount > 0 ? (
                            <Button
                              size="sm"
                              className={`shrink-0 text-gray-900 font-bold border-0 hover:opacity-90 touch-target ${isExercise ? "bg-orange-600" : "bg-purple-600"}`}
                              onClick={() => router.push(`/dashboard/quizzes/${quiz.id}?courseId=${course.id}`)}
                            >
                              {isExercise ? (
                                <><Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />Start</>
                              ) : (
                                <><GraduationCap className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5" />Start</>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-500 shrink-0 italic">No questions</span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
