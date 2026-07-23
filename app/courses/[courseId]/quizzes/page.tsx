"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { HelpCircle, Dumbbell, GraduationCap, ArrowLeft, Layers } from "lucide-react"
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
  description: string
  quizzes: QuizItem[]
  modules: {
    id: string
    title: string
    quizzes: QuizItem[]
    lessons: { quizzes: QuizItem[] }[]
  }[]
}

export default function CourseQuizzesPage() {
  const params = useParams()
  const router = useRouter()
  const courseId = params.courseId as string

  const [course, setCourse] = useState<CourseWithQuizzes | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/courses/with-quizzes")
        if (res.ok) {
          const data = await res.json()
          const validCourses = Array.isArray(data) ? data : []
          const found = validCourses.find(c => c.id === courseId)
          if (found) {
            setCourse(found)
          }
        }
      } catch (err) {
        console.error("Failed to load course quizzes:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId])

  function getAllQuizzes(course: CourseWithQuizzes): QuizItem[] {
    const seen = new Map<string, QuizItem>()
    course.modules.forEach(m => {
      m.lessons.forEach(l => l.quizzes?.forEach(q => { if (!seen.has(q.id)) seen.set(q.id, q) }))
      m.quizzes?.forEach(q => { if (!seen.has(q.id)) seen.set(q.id, q) })
    })
    course.quizzes?.forEach(q => { if (!seen.has(q.id)) seen.set(q.id, q) })
    return Array.from(seen.values())
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a237e] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#1a237e]">EasyFrench</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-12">
          <div className="h-8 sm:h-10 w-36 sm:w-48 bg-gray-200 animate-pulse rounded-lg mb-6" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 sm:h-24 bg-white border border-gray-200 animate-pulse rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col">
        <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1a237e] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                <GraduationCap className="w-5 h-5" />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-[#1a237e]">EasyFrench</span>
            </Link>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 text-center mt-12 sm:mt-20">
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-4">Course Not Found</h2>
          <p className="text-sm sm:text-base text-gray-500 mb-6 sm:mb-8">We couldn't find the course you're looking for.</p>
          <Button onClick={() => router.push("/")} className="bg-[#1a237e] hover:bg-[#283593] text-white touch-target">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </div>
      </div>
    )
  }

  const allQuizzes = getAllQuizzes(course)

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1a237e] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              <GraduationCap className="w-5 h-5" />
            </div>
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#1a237e]">EasyFrench</span>
          </Link>
          <div className="hidden sm:flex items-center gap-2 bg-[#e8f5e9] text-[#2e7d32] px-3 py-1.5 rounded-full text-xs font-bold border border-[#c8e6c9]">
            <span className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full animate-pulse" />
            Practice Mode
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-gray-500 hover:text-gray-900 transition-colors mb-5 sm:mb-8 font-medium touch-target"
        >
          <ArrowLeft className="w-3 sm:w-4 h-3 sm:h-4" /> Back to Home
        </button>

        <div className="mb-8 sm:mb-10 text-center md:text-left flex flex-col md:flex-row items-center gap-4 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#1a237e]/10 text-[#1a237e] rounded-2xl flex items-center justify-center shrink-0">
            <Layers className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <div>
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                {allQuizzes.length} Assessment{allQuizzes.length !== 1 ? "s" : ""}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 break-words">
              {course.title}
            </h1>
            <p className="text-gray-500 text-sm md:text-base max-w-2xl mx-auto md:mx-0">
              {course.description}
            </p>
          </div>
        </div>

        {allQuizzes.length === 0 ? (
          <Card className="p-6 sm:p-12 text-center rounded-3xl border-gray-200 shadow-sm bg-white">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">No Quizzes Available</h3>
            <p className="text-gray-500">This course currently has no public quizzes available for practice.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {allQuizzes.map((quiz, idx) => {
              const isExercise = quiz.type === "EXERCISE"
              const questionCount = quiz.questions?.length ?? 0

              return (
                <Card
                  key={quiz.id}
                  className="
                    flex flex-col sm:flex-row
                    items-center sm:items-center
                    gap-4 sm:gap-5
                    p-4 sm:p-5
                    bg-white
                    border border-gray-200
                    hover:border-[#1a237e]/30
                    hover:shadow-md
                    transition-all
                    rounded-2xl
  "
                >
                  {/* Icon / Number */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isExercise
                    ? "bg-orange-50 text-orange-600 border border-orange-100"
                    : "bg-[#1a237e]/5 text-[#1a237e] border border-[#1a237e]/10"
                    }`}>
                    {isExercise ? <Dumbbell className="w-6 h-6" /> : <GraduationCap className="w-6 h-6" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 text-center sm:text-left w-full min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                      <h3 className="font-bold text-gray-900 text-base sm:text-lg break-words">
                        {quiz.title}
                      </h3>
                      <span className={`inline-flex self-center sm:self-auto text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider shrink-0 ${isExercise
                        ? "bg-orange-100 text-orange-700"
                        : "bg-[#1a237e]/10 text-[#1a237e]"
                        }`}>
                        {isExercise ? "Exercise" : "Quiz"}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium break-words">
                      {questionCount > 0 ? `${questionCount} questions · Pass mark: ${quiz.passMark}%` : "No questions yet"}
                      {quiz.timeLimit ? ` · ${quiz.timeLimit} mins` : ""}
                    </p>
                  </div>

                  {/* Action */}
                  <div className="w-full sm:w-auto sm:ml-auto shrink-0">
                    {questionCount > 0 ? (
                      <Button
                        className={`w-full sm:w-auto min-w-[160px] px-4 sm:px-6 py-3 sm:py-5 rounded-xl font-bold shadow-sm touch-target ${isExercise
                          ? "bg-orange-600 hover:bg-orange-700 text-white"
                          : "bg-[#2e7d32] hover:bg-[#388e3c] text-white"
                          }`}
                        onClick={() => router.push(`/quizzes/${quiz.id}?courseId=${course.id}`)}
                      >
                        {isExercise ? "Solve Exercise" : "Start Quiz"}
                      </Button>
                    ) : (
                      <div className="px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl bg-gray-50 text-gray-400 text-xs sm:text-sm font-medium border border-gray-100 text-center">
                        Coming soon
                      </div>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
