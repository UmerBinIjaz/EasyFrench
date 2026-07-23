"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizPlayer } from "@/components/quiz/QuizPlayer"
import {
  CheckCircle2, XCircle, ArrowLeft, RefreshCcw, BookOpen,
  Clock, Target, HelpCircle, Dumbbell, ChevronRight, GraduationCap
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/providers/ToastProvider"

function PublicQuizTakingContent() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { showToast } = useToast()
  const quizId = params.id as string
  const courseId = searchParams.get("courseId")

  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([])

  useEffect(() => {
    async function load() {
      try {
        const quizRes = await fetch(`/api/quizzes/${quizId}`)
        if (!quizRes.ok) throw new Error("Quiz not found")
        const quizData = await quizRes.json()
        setQuiz(quizData)

        // Load sibling quizzes from same course for Next Quiz navigation
        if (courseId) {
          const courseRes = await fetch(`/api/courses/with-quizzes`)
          if (courseRes.ok) {
            const allCourses = await courseRes.json()
            const course = allCourses.find((c: any) => c.id === courseId)
            if (course) {
              const all: any[] = []
              course.modules.forEach((m: any) => {
                m.lessons.forEach((l: any) => l.quizzes?.forEach((q: any) => {
                  // Deduplicate to match tests list view
                  if (!all.some(existing => existing.id === q.id)) {
                    all.push(q)
                  }
                }))
                m.quizzes?.forEach((q: any) => {
                  if (!all.some(existing => existing.id === q.id)) {
                    all.push(q)
                  }
                })
              })
              course.quizzes?.forEach((q: any) => {
                if (!all.some(existing => existing.id === q.id)) {
                  all.push(q)
                }
              })
              setCourseQuizzes(all)
            }
          }
        }
      } catch (err) {
        setError("Could not load this quiz. It may not exist.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizId, courseId])

  const handleSubmit = async (answers: number[]) => {
    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/quizzes/${quizId}/attempt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setResult(data)
      showToast("Quiz submitted successfully!", "success")
    } catch {
      setError("Failed to submit. Please try again.")
      showToast("Failed to submit quiz. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRetry = () => setResult(null)

  // Find next quiz in course sequence
  const currentIndex = courseQuizzes.findIndex(q => q.id === quizId)
  const nextQuiz = courseQuizzes[currentIndex + 1] ?? null

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 mt-8 sm:mt-12 px-4">
        <div className="h-8 sm:h-10 w-36 sm:w-48 bg-slate-200 animate-pulse rounded-lg" />
        <div className="h-48 sm:h-64 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto mt-12 sm:mt-20 text-center px-4">
        <div className="w-16 sm:w-20 h-16 sm:h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
          <XCircle className="w-8 sm:w-10 h-8 sm:h-10 text-red-500" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Quiz Not Found</h2>
        <p className="text-sm sm:text-base text-slate-500 mb-6 sm:mb-8">{error || "This quiz does not exist."}</p>
        <Button onClick={() => router.push("/")} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full touch-target">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home Page
        </Button>
      </div>
    )
  }

  const isExercise = quiz.type === "EXERCISE"
  const hasQuestions = quiz.questions?.length > 0

  return (
    <div className="max-w-2xl mx-auto space-y-5 sm:space-y-6 pb-24 px-4">
      {/* Back + Course quiz navigator */}
      <div className="flex items-center justify-between gap-3 pt-4 sm:pt-6">
        <button
          onClick={() => router.push("/#practice")}
          className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors touch-target"
        >
          <ArrowLeft className="w-3 sm:w-4 h-3 sm:h-4" /> Exit Practice
        </button>

        {courseQuizzes.length > 1 && currentIndex !== -1 && (
          <span className="text-[10px] sm:text-xs text-slate-400 font-semibold bg-slate-100 px-2 sm:px-3 py-1 rounded-full">
            Practice Test {currentIndex + 1} of {courseQuizzes.length}
          </span>
        )}
      </div>

      {/* Header card */}
      <div className={`rounded-2xl sm:rounded-3xl p-5 sm:p-8 text-white shadow-xl ${isExercise
        ? "bg-gradient-to-br from-orange-500 to-amber-600 shadow-orange-500/10"
        : "bg-gradient-to-br from-purple-600 to-indigo-700 shadow-indigo-600/10"
        }`}>
        <div className="flex items-center gap-2 mb-3 sm:mb-4">
          <div className="w-8 sm:w-9 h-8 sm:h-9 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
            {isExercise ? <Dumbbell className="w-3.5 sm:w-4 h-3.5 sm:h-4" /> : <HelpCircle className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
          </div>
          <span className="text-[10px] sm:text-xs font-bold bg-white/20 px-2 sm:px-3 py-1 rounded-full uppercase tracking-wider">
            {isExercise ? "Practice Exercise" : "Level Assessment"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl md:text-3xl font-black mb-2 tracking-tight break-words">{quiz.title}</h1>
        {quiz.description && <p className="text-white/80 text-xs sm:text-sm leading-relaxed">{quiz.description}</p>}

        {/* Meta row */}
        <div className="flex flex-wrap gap-2 sm:gap-4 mt-4 sm:mt-6 text-[11px] sm:text-sm text-white/90 font-medium">
          <span className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl">
            <Target className="w-3 sm:w-4 h-3 sm:h-4 opacity-75 shrink-0" />
            {quiz.questions?.length ?? 0} questions
          </span>
          {quiz.timeLimit && (
            <span className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl">
              <Clock className="w-3 sm:w-4 h-3 sm:h-4 opacity-75 shrink-0" />
              {quiz.timeLimit} minutes
            </span>
          )}
          <span className="flex items-center gap-1 sm:gap-1.5 bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl">
            <CheckCircle2 className="w-3 sm:w-4 h-3 sm:h-4 opacity-75 shrink-0" />
            Pass mark: {quiz.passMark}%
          </span>
        </div>
      </div>

      {/* No questions */}
      {!hasQuestions && (
        <Card className="p-6 sm:p-12 text-center rounded-2xl sm:rounded-3xl border-slate-200 shadow-sm">
          <div className="w-14 sm:w-16 h-14 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <HelpCircle className="w-6 sm:w-8 h-6 sm:h-8 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">No Questions Yet</h3>
          <p className="text-xs sm:text-sm text-slate-500">This assessment has no questions yet. Check back later.</p>
        </Card>
      )}

      {/* Results view */}
      {result && (
        <Card className="p-5 sm:p-8 rounded-2xl sm:rounded-3xl border-slate-200 shadow-md bg-white">
          {/* Score circle */}
          <div className="text-center mb-6 sm:mb-8">
            <div className={`w-24 sm:w-28 h-24 sm:h-28 rounded-full flex flex-col items-center justify-center mx-auto mb-3 sm:mb-4 ${result.passed
              ? "bg-emerald-50 border-4 border-emerald-200"
              : "bg-red-50 border-4 border-red-200"
              }`}>
              <span className={`text-2xl sm:text-3xl font-black ${result.passed ? "text-emerald-600" : "text-red-500"}`}>
                {result.score}%
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mb-1">
              {result.passed ? "Excellent Work! 🎉" : "Keep Practicing!"}
            </h2>
            <p className="text-sm sm:text-base text-slate-500 font-medium">
              You got <b>{result.correctCount}</b> of <b>{result.totalQuestions}</b> correct
            </p>
            <span className={`inline-block mt-3 px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${result.passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
              }`}>
              {result.passed ? "PASSED ✓" : `FAILED — need ${quiz.passMark}%`}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center mb-6 sm:mb-8">
            <Button variant="outline" onClick={handleRetry} className="rounded-full font-semibold px-4 sm:px-5 touch-target w-full sm:w-auto">
              <RefreshCcw className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" /> Try Again
            </Button>
            {nextQuiz && (nextQuiz.questions?.length ?? 0) > 0 && (
              <Button
                className={`rounded-full font-semibold px-4 sm:px-5 text-white touch-target w-full sm:w-auto ${isExercise ? "bg-orange-600 hover:bg-orange-500" : "bg-violet-600 hover:bg-violet-500"
                  }`}
                onClick={() => {
                  setResult(null)
                  router.push(`/quizzes/${nextQuiz.id}${courseId ? `?courseId=${courseId}` : ""}`)
                }}
              >
                Solve Next Quiz
                <ChevronRight className="w-3.5 sm:w-4 h-3.5 sm:h-4 ml-1 sm:ml-1.5" />
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => router.push("/#practice")}
              className="rounded-full font-semibold px-4 sm:px-5 touch-target w-full sm:w-auto"
            >
              <BookOpen className="w-3.5 sm:w-4 h-3.5 sm:h-4 mr-1.5 sm:mr-2" /> All Practice Tests
            </Button>
          </div>

          {/* Answer review */}
          {quiz.questions?.length > 0 && (
            <div className="space-y-4 sm:space-y-5 border-t border-slate-100 pt-5 sm:pt-6">
              <h3 className="font-bold text-slate-900 text-lg sm:text-xl tracking-tight mb-2">Review Your Answers</h3>
              {quiz.questions.map((q: any, i: number) => {
                const studentAnswer = result.result?.answers?.[i] ?? -1
                const isCorrect = studentAnswer === q.correctAnswer
                return (
                  <div key={i} className={`p-4 sm:p-5 rounded-2xl border-2 ${isCorrect
                    ? "border-emerald-100 bg-emerald-50/40"
                    : "border-red-100 bg-red-50/40"
                    }`}>
                    <p className="font-bold text-slate-900 mb-3 text-xs sm:text-sm flex items-start gap-2 sm:gap-2.5 break-words">
                      <span className={`w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${isCorrect ? "bg-emerald-500" : "bg-red-400"
                        }`}>
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      {i + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pl-7">
                      {q.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className={`text-[11px] sm:text-xs px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl font-semibold border break-words ${oIdx === q.correctAnswer
                          ? "bg-emerald-100 border-emerald-200 text-emerald-900"
                          : oIdx === studentAnswer && !isCorrect
                            ? "bg-red-100 border-red-200 text-red-900 line-through"
                            : "bg-white border-slate-100 text-slate-600"
                          }`}>
                          {oIdx === q.correctAnswer && "✓ "}{opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-3 sm:mt-3.5 pl-7 text-[11px] sm:text-xs text-slate-700">
                        <div className="bg-blue-50/80 border border-blue-100 p-2.5 sm:p-3 rounded-xl text-blue-900">
                          <span className="font-bold block mb-1">💡 Explanation:</span>
                          {q.explanation}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Next quiz block at bottom */}
          {nextQuiz && (nextQuiz.questions?.length ?? 0) > 0 && (
            <div className="mt-6 sm:mt-8 border-t border-slate-100 pt-5 sm:pt-6">
              <div
                className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200 hover:border-violet-200 hover:bg-violet-50/30 transition-all cursor-pointer group"
                onClick={() => {
                  setResult(null)
                  router.push(`/quizzes/${nextQuiz.id}${courseId ? `?courseId=${courseId}` : ""}`)
                }}
              >
                <div className={`w-9 sm:w-10 h-9 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 ${nextQuiz.type === "EXERCISE"
                  ? "bg-orange-100 text-orange-700"
                  : "bg-purple-100 text-purple-700"
                  }`}>
                  {currentIndex + 2}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 font-bold uppercase tracking-wider">Up Next</p>
                  <p className="font-bold text-slate-900 text-sm sm:text-base truncate">{nextQuiz.title}</p>
                </div>
                <ChevronRight className="w-4 sm:w-5 h-4 sm:h-5 text-slate-400 group-hover:text-violet-600 group-hover:translate-x-1 transition-all shrink-0" />
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Quiz Player */}
      {!result && hasQuestions && (
        <QuizPlayer quiz={quiz} onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      )}
    </div>
  )
}

export default function PublicQuizTakingPage() {
  return (
    <div className="min-h-screen bg-[#f8fafc]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 sm:w-8 h-7 sm:h-8 bg-[#1a237e] rounded-lg flex items-center justify-center text-white font-bold text-sm">
              <GraduationCap className="w-4 sm:w-5 h-4 sm:h-5" />
            </div>
            <span className="text-sm sm:text-lg font-bold tracking-tight text-[#1a237e]">EasyFrench</span>
          </Link>
          <div className="flex items-center gap-2 bg-[#e8f5e9] text-[#2e7d32] px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-bold border border-[#c8e6c9]">
            <span className="w-1 sm:w-1.5 h-1 sm:h-1.5 bg-[#2e7d32] rounded-full animate-pulse" />
            Practice Mode
          </div>
        </div>
      </header>

      {/* Main Page Area */}
      <main className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-6">
        <Suspense fallback={
          <div className="max-w-2xl mx-auto space-y-4 mt-8 sm:mt-12 px-4">
            <div className="h-8 sm:h-10 w-36 sm:w-48 bg-slate-200 animate-pulse rounded-lg" />
            <div className="h-48 sm:h-64 bg-slate-200 animate-pulse rounded-2xl" />
          </div>
        }>
          <PublicQuizTakingContent />
        </Suspense>
      </main>
    </div>
  )
}
