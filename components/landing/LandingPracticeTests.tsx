"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  HelpCircle, Dumbbell, ChevronRight,
  GraduationCap, Layers, ArrowRight
} from "lucide-react"

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
  description: string
  quizzes: QuizItem[]
  modules: {
    id: string
    title: string
    quizzes: QuizItem[]
    lessons: { quizzes: QuizItem[] }[]
  }[]
}

export function LandingPracticeTests() {
  const router = useRouter()
  const [courses, setCourses] = useState<CourseWithQuizzes[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/courses/with-quizzes")
        if (res.ok) {
          const data = await res.json()
          const validCourses = Array.isArray(data) ? data : []
          setCourses(validCourses)
          if (validCourses.length > 0) {
            setExpandedCourse(validCourses[0].id)
          }
        }
      } catch (err) {
        console.error("Failed to load courses with quizzes:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  // Flatten and deduplicate all quizzes from a course
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

  if (loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-black text-white mb-2">Practice Tests</h2>
          <p className="text-slate-400">Loading tests and practice quizzes...</p>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-white/5 border border-white/5 animate-pulse rounded-2xl" />
          ))}
        </div>
      </div>
    )
  }

  if (coursesWithQuizzes.length === 0) {
    return null // Don't show the section if no quizzes exist
  }

  return (
    <section id="practice" className="py-24 px-6 md:px-12 relative border-t border-white/5 bg-[#0a0f1d]">
      <div className="absolute inset-0 bg-gradient-to-b from-[#080c14] to-[#0a0f1d] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <p className="text-blue-400 text-sm font-semibold uppercase tracking-wider mb-2">Self Assessment</p>
          <h2 className="text-4xl font-black text-white">Free Practice Tests</h2>
          <p className="text-slate-400 mt-2">
            No registration required. Test your level immediately by choosing any of our structured exercises or quizzes.
          </p>
        </div>

        <div className="space-y-4 max-w-4xl mx-auto">
          {coursesWithQuizzes.map((course) => {
            const allQuizzes = getAllQuizzes(course)
            const isOpen = expandedCourse === course.id

            return (
              <Card
                key={course.id}
                className="overflow-hidden bg-white/3 border-white/8 backdrop-blur-xl hover:border-white/12 transition-all duration-300"
              >
                {/* Course Header Button */}
                <button
                  className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/5 transition-colors text-left text-white"
                  onClick={() => setExpandedCourse(isOpen ? null : course.id)}
                >
                  <div className="w-11 h-11 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white text-lg truncate">{course.title}</h3>
                    </div>
                    <p className="text-sm text-slate-400 mt-0.5">{allQuizzes.length} assessment{allQuizzes.length !== 1 ? "s" : ""} available</p>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform shrink-0 ${isOpen ? "rotate-90 text-white" : ""}`} />
                </button>

                {/* Quizzes List */}
                {isOpen && (
                  <div className="border-t border-white/5 divide-y divide-white/5 bg-black/20">
                    {allQuizzes.map((quiz, idx) => {
                      const isExercise = quiz.type === "EXERCISE"
                      const questionCount = quiz.questions?.length ?? 0

                      return (
                        <div
                          key={quiz.id}
                          className="flex items-center gap-4 px-6 py-4 hover:bg-white/3 transition-colors group text-white"
                        >
                          {/* Item number badge */}
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${isExercise
                            ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                            : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                            }`}>
                            {idx + 1}
                          </div>

                          {/* Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-200 group-hover:text-white transition-colors truncate">
                                {quiz.title}
                              </span>
                              <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${isExercise
                                ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                : "bg-violet-500/10 text-violet-400 border border-violet-500/20"
                                }`}>
                                {isExercise ? "Exercise" : "Quiz"}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {questionCount > 0 ? `${questionCount} questions · Pass: ${quiz.passMark}%` : "No questions yet"}
                              {quiz.timeLimit ? ` · ${quiz.timeLimit} min` : ""}
                            </p>
                          </div>

                          {/* Action button */}
                          {questionCount > 0 ? (
                            <Button
                              size="sm"
                              className={`shrink-0 rounded-full font-semibold transition-all px-4 ${isExercise
                                ? "bg-orange-600 hover:bg-orange-500 text-white"
                                : "bg-violet-600 hover:bg-violet-500 text-white"
                                }`}
                              onClick={() => router.push(`/quizzes/${quiz.id}?courseId=${course.id}`)}
                            >
                              {isExercise ? (
                                <><Dumbbell className="w-3.5 h-3.5 mr-1.5" />Solve</>
                              ) : (
                                <><GraduationCap className="w-3.5 h-3.5 mr-1.5" />Start</>
                              )}
                            </Button>
                          ) : (
                            <span className="text-xs text-slate-600 shrink-0 italic">No questions</span>
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
      </div>
    </section>
  )
}
