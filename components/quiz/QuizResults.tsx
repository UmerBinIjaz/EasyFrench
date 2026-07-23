"use client"

import { CheckCircle2, XCircle, ArrowRight, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useRouter } from "next/navigation"

interface QuizResultsProps {
  result: {
    score: number
    passed: boolean
    correctCount: number
    totalQuestions: number
  }
  onRetry: () => void
  nextLessonUrl?: string
}

export function QuizResults({ result, onRetry, nextLessonUrl }: QuizResultsProps) {
  const router = useRouter()

  return (
    <Card className="p-8 text-center">
      <div className="flex justify-center mb-6">
        {result.passed ? (
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
        ) : (
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
            <XCircle className="w-10 h-10 text-red-500" />
          </div>
        )}
      </div>

      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        {result.passed ? "Congratulations!" : "Don't give up!"}
      </h2>
      
      <p className="text-slate-500 mb-8">
        You got {result.correctCount} correct answer{result.correctCount !== 1 ? 's' : ''} out of {result.totalQuestions}.
      </p>

      <div className="text-5xl font-black text-slate-900 mb-8">
        {result.score}%
      </div>

      <div className="flex gap-4 justify-center">
        {!result.passed ? (
          <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        ) : (
          nextLessonUrl && (
            <Button onClick={() => router.push(nextLessonUrl)} className="bg-blue-600 hover:bg-blue-700">
              Next Lesson
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )
        )}
        <Button variant="outline" onClick={() => router.push('/dashboard/courses')}>
          Back to Courses
        </Button>
      </div>
    </Card>
  )
}
