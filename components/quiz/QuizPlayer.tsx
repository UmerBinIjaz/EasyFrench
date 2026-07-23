"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { HelpCircle } from "lucide-react"

interface QuizPlayerProps {
  quiz: any
  onSubmit: (answers: number[]) => void
  isSubmitting?: boolean
}

export function QuizPlayer({ quiz, onSubmit, isSubmitting }: QuizPlayerProps) {
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
  const [answers, setAnswers] = useState<number[]>(new Array(quiz.questions.length).fill(-1))

  const currentQuestion = quiz.questions[currentQuestionIdx]
  const isLastQuestion = currentQuestionIdx === quiz.questions.length - 1
  const hasAnsweredCurrent = answers[currentQuestionIdx] !== -1
  const allAnswered = answers.every(a => a !== -1)

  const handleSelectOption = (optionIdx: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIdx] = optionIdx
    setAnswers(newAnswers)
  }

  const handleNext = () => {
    if (!isLastQuestion) {
      setCurrentQuestionIdx(prev => prev + 1)
    }
  }

  const handlePrev = () => {
    if (currentQuestionIdx > 0) {
      setCurrentQuestionIdx(prev => prev - 1)
    }
  }

  const handleSubmit = () => {
    if (allAnswered) {
      onSubmit(answers)
    }
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6 border-b pb-4">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
          <HelpCircle className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-900">Check Your Knowledge</h3>
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">
            Question {currentQuestionIdx + 1} of {quiz.questions.length}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <h4 className="text-base font-semibold text-slate-800 mb-4 leading-relaxed">
          {currentQuestion.question}
        </h4>
        
        <div className="space-y-3">
          {currentQuestion.options.map((option: string, idx: number) => {
            const isSelected = answers[currentQuestionIdx] === idx
            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  isSelected 
                    ? 'border-blue-500 bg-blue-50/50 text-blue-900' 
                    : 'border-slate-200 hover:border-blue-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected ? 'border-blue-500 bg-blue-500 text-white' : 'border-slate-300'
                  }`}>
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <span className="font-medium text-sm">{option}</span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-8">
        {currentQuestionIdx > 0 && (
          <Button variant="outline" onClick={handlePrev} className="flex-1">
            Previous
          </Button>
        )}
        
        {isLastQuestion ? (
          <Button 
            className="flex-1 bg-blue-500 hover:bg-blue-600" 
            onClick={handleSubmit}
            disabled={!allAnswered || isSubmitting}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Answers'}
          </Button>
        ) : (
          <Button 
            className="flex-1 bg-blue-500 hover:bg-blue-600" 
            onClick={handleNext}
            disabled={!hasAnsweredCurrent}
          >
            Next Question
          </Button>
        )}
      </div>
    </Card>
  )
}
