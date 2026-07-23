"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { QuizPlayer } from "@/components/quiz/QuizPlayer"
import {
  CheckCircle2, XCircle, ArrowLeft, RefreshCcw, BookOpen,
  Clock, Target, HelpCircle, Dumbbell, ChevronRight
} from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"
import Link from "next/link"

function QuizTakingContent() {
  const params = useParams()
  const { showToast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()
  const quizId = params.id as string
  const courseId = searchParams.get("courseId")
  const lessonId = searchParams.get("lessonId")

  const [quiz, setQuiz] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [courseQuizzes, setCourseQuizzes] = useState<any[]>([])
  const [lesson, setLesson] = useState<{ id: string; title: string } | null>(null)
  const [course, setCourse] = useState<any>(null)

  useEffect(() => {
    if (lessonId) {
      fetch(`/api/lessons/${lessonId}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => {
          if (d) setLesson({ id: d.id, title: d.title })
        })
        .catch(() => { })
    }
  }, [lessonId])

  useEffect(() => {
    async function load() {
      try {
        const quizRes = await fetch(`/api/quizzes/${quizId}`)
        if (!quizRes.ok) throw new Error("Quiz not found")
        const quizData = await quizRes.json()
        setQuiz(quizData)

        // Load course data for navigation between lessons and quizzes
        if (courseId) {
          const courseRes = await fetch(`/api/courses/${courseId}`)
          if (courseRes.ok) {
            const courseData = await courseRes.json()
            if (courseData) {
              setCourse(courseData)
              const all: any[] = []
              courseData.lessons?.forEach((l: any) => l.quizzes?.forEach((q: any) => all.push(q)))
              courseData.quizzes?.forEach((q: any) => all.push(q))
              setCourseQuizzes(all)
            }
          }
        }

        // Check if student already has a result for this quiz — if so, show it immediately
        const resultRes = await fetch(`/api/quiz-results?quizId=${quizId}`)
        if (resultRes.ok) {
          const existingResults = await resultRes.json()
          if (existingResults.length > 0) {
            const last = existingResults[0] // most recent result (ordered by completedAt desc)
            setResult({
              result: last,
              passed: last.passed,
              score: last.score,
              correctCount: last.correctAnswers,
              totalQuestions: last.totalQuestions,
            })
          }
        }
      } catch (err) {
        setError("Could not load this quiz. It may not exist or you may not have access.")
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
  const prevQuiz = currentIndex > 0 ? courseQuizzes[currentIndex - 1] : null

  // Find next lesson/module when quiz is part of a lesson
  const allLessons: any[] = course?.modules?.flatMap((m: any) => m.lessons) ?? []
  const currentLessonIdx = lesson ? allLessons.findIndex((l: any) => l.id === lesson.id) : -1
  const nextLessonObj = currentLessonIdx >= 0 && currentLessonIdx < allLessons.length - 1 ? allLessons[currentLessonIdx + 1] : null
  const nextLessonUrl = nextLessonObj ? `/dashboard/lessons/${nextLessonObj.id}` : null
  const nextLessonLabel = nextLessonObj ? `Next Lesson: ${nextLessonObj.title}` : null

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4 mt-8">
        <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    )
  }

  if (error || !quiz) {
    return (
      <div className="max-w-2xl mx-auto mt-16 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Quiz Not Found</h2>
        <p className="text-slate-400 mb-8">{error || "This quiz does not exist."}</p>
        <Button onClick={() => router.push("/dashboard/tests")} variant="outline" className="border-white/5 hover:bg-white/5 text-gray-900">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Practice Tests
        </Button>
      </div>
    )
  }

  const isExercise = quiz.type === "EXERCISE"
  const hasQuestions = quiz.questions?.length > 0

  return (
    <div className="max-w-2xl mx-auto space-y-6 px-4 sm:px-0">
      {/* Back + Course quiz navigator */}
      <div className="flex items-center justify-between gap-3 pt-4 sm:pt-0">
        {lesson ? (
          <Link
            href={`/dashboard/lessons/${lesson.id}`}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors touch-target"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Lesson
          </Link>
        ) : (
          <button
            onClick={() => router.push(courseId ? `/dashboard/tests` : "/dashboard/tests")}
            className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500 hover:text-slate-800 transition-colors touch-target"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Tests
          </button>
        )}

        {/* Quiz sequence indicator */}
        {courseQuizzes.length > 1 && (
          <span className="text-[10px] sm:text-xs text-slate-400 font-medium">
            {currentIndex + 1} / {courseQuizzes.length} assessments
          </span>
        )}
      </div>

      {/* Header card */}
      <div className={`rounded-2xl p-5 sm:p-6 text-gray-900 ${isExercise ? "bg-gradient-to-br from-orange-500 to-orange-600" : "bg-gradient-to-br from-purple-600 to-indigo-600"}`}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 text-white rounded-lg flex items-center justify-center">
            {isExercise ? <Dumbbell className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </div>
          <span className="text-[10px] sm:text-xs font-bold bg-white/20 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">
            {isExercise ? "Exercise" : "Quiz"}
          </span>
        </div>
        <h1 className="text-xl sm:text-2xl text-white font-bold mb-1 break-words">{quiz.title}</h1>
        {quiz.description && <p className="text-gray-white text-xs sm:text-sm">{quiz.description}</p>}

        {/* Meta row */}
        <div className="flex flex-wrap gap-3 sm:gap-4 mt-4 text-xs sm:text-sm text-gray-900/90">
          <span className="flex items-center gap-1.5 text-white">
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70" />
            {quiz.questions?.length ?? 0} questions
          </span>
          {quiz.timeLimit && (
            <span className="flex items-center gap-1.5 text-white">
              <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70" />
              {quiz.timeLimit} minutes
            </span>
          )}
          <span className="flex items-center gap-1.5 text-white">
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 opacity-70" />
            Pass: {quiz.passMark}%
          </span>
        </div>
      </div>

      {/* No questions */}
      {!hasQuestions && (
        <Card className="p-8 sm:p-12 text-center">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-7 h-7 sm:w-8 sm:h-8 text-slate-400" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 mb-2">No Questions Yet</h3>
          <p className="text-gray-600 text-sm">This assessment has no questions yet. Check back later.</p>
        </Card>
      )}

      {/* Results */}
      {result && (
        <Card className="p-5 sm:p-8">
          {/* Score circle */}
          <div className="text-center mb-6 sm:mb-8">
            <div className={`w-24 h-24 sm:w-28 sm:h-28 rounded-full flex flex-col items-center justify-center mx-auto mb-4 ${result.passed ? "bg-emerald-500/10 border-4 border-emerald-500/20" : "bg-red-500/10 border-4 border-red-500/20"}`}>
              <span className={`text-2xl sm:text-3xl font-black ${result.passed ? "text-emerald-400" : "text-red-400"}`}>{result.score}%</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-1">
              {result.passed ? "Congratulations! 🎉" : "Keep Practicing!"}
            </h2>
            <p className="text-slate-400 text-sm">
              You got <b className="text-gray-900">{result.correctCount}</b> of <b className="text-gray-900">{result.totalQuestions}</b> correct
            </p>
            <span className={`inline-block mt-3 px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold ${result.passed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>
              {result.passed ? "PASSED ✓" : `FAILED — need ${quiz.passMark}%`}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {!result.passed && (
              <Button variant="outline" onClick={handleRetry} size="sm">
                <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
              </Button>
            )}
            {result.passed && lesson && (
              <>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => router.push(`/dashboard/lessons/${lesson.id}`)}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" /> Back to Lesson
                </Button>
                {nextLessonUrl && (
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => router.push(nextLessonUrl!)}
                  >
                    <ChevronRight className="w-4 h-4 mr-1" /> {nextLessonLabel}
                  </Button>
                )}
              </>
            )}
            {result.passed && !lesson && nextQuiz && (nextQuiz.questions?.length ?? 0) > 0 && (
              <Button
                size="sm"
                className={isExercise ? "bg-orange-500 hover:bg-orange-600" : "bg-purple-600 hover:bg-purple-700"}
                onClick={() => {
                  setResult(null)
                  router.push(`/dashboard/quizzes/${nextQuiz.id}${courseId ? `?courseId=${courseId}` : ""}`)
                }}
              >
                Next: {nextQuiz.title}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(lesson ? `/dashboard/lessons/${lesson.id}` : "/dashboard/tests")}
            >
              <BookOpen className="w-4 h-4 mr-2" /> {lesson ? "Back to Lesson" : "All Tests"}
            </Button>
          </div>

          {/* Answer review */}
          {quiz.questions?.length > 0 && (
            <div className="space-y-4 border-t border-white/5 pt-6">
              <h3 className="font-bold text-gray-900 text-base sm:text-lg">Review Your Answers</h3>
              {quiz.questions.map((q: any, i: number) => {
                const studentAnswer = result.result?.answers?.[i] ?? -1
                const isCorrect = studentAnswer === q.correctAnswer
                return (
                  <div key={i} className={`p-4 rounded-xl border-2 ${isCorrect ? "border-emerald-500/10 bg-emerald-500/5 text-emerald-400" : "border-red-500/10 bg-red-500/5 text-red-400"}`}>
                    <p className="font-semibold text-gray-900 mb-3 text-xs sm:text-sm flex items-start gap-2">
                      <span className={`w-5 h-5 rounded-full text-gray-900 text-[10px] flex items-center justify-center shrink-0 mt-0.5 ${isCorrect ? "bg-emerald-500" : "bg-red-400"}`}>
                        {isCorrect ? "✓" : "✗"}
                      </span>
                      {i + 1}. {q.question}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 pl-7">
                      {q.options.map((opt: string, oIdx: number) => (
                        <div key={oIdx} className={`text-xs px-3 py-2 rounded-lg font-medium ${oIdx === q.correctAnswer
                          ? "bg-emerald-500/20 text-emerald-600"
                          : oIdx === studentAnswer && !isCorrect
                            ? "bg-red-500/20 text-red-600 line-through"
                            : "bg-white/5 text-gray-600"
                          }`}>
                          {oIdx === q.correctAnswer && "✓ "}{opt}
                        </div>
                      ))}
                    </div>
                    {q.explanation && (
                      <div className="mt-3 pl-7 text-xs bg-blue-500/10 border border-blue-500/20 p-2 rounded-lg text-blue-300">
                        <span className="font-bold">💡 Explanation:</span> {q.explanation}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Next quiz teaser at bottom */}
          {nextQuiz && (nextQuiz.questions?.length ?? 0) > 0 && (
            <div className="mt-6 border-t border-white/5 pt-6">
              <div
                className="flex items-center gap-3 sm:gap-4 p-4 rounded-xl bg-white/5 border border-white/5 hover:border-purple-500/30 hover:bg-white/10 transition-all cursor-pointer group"
                onClick={() => router.push(`/dashboard/quizzes/${nextQuiz.id}${courseId ? `?courseId=${courseId}` : ""}`)}
              >
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 ${nextQuiz.type === "EXERCISE" ? "bg-orange-500/10 text-orange-400" : "bg-purple-500/10 text-purple-400"}`}>
                  {currentIndex + 2}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs text-slate-400 font-medium">Up Next</p>
                  <p className="font-bold text-gray-900 text-sm sm:text-base truncate">{nextQuiz.title}</p>
                </div>
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 group-hover:text-purple-400 group-hover:translate-x-1 transition-all shrink-0" />
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

export default function QuizTakingPage() {
  return (
    <Suspense fallback={
      <div className="max-w-2xl mx-auto space-y-4 mt-8">
        <div className="h-10 w-48 bg-slate-100 animate-pulse rounded-lg" />
        <div className="h-64 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    }>
      <QuizTakingContent />
    </Suspense>
  )
}
