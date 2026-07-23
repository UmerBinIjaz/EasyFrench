"use client"

import { useState } from "react"
import { Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"

interface QuizCreatorProps {
  initialData?: any
  onSave: (data: any) => void
}

export function QuizCreator({ initialData, onSave }: QuizCreatorProps) {
  const [title, setTitle] = useState(initialData?.title || "")
  const [description, setDescription] = useState(initialData?.description || "")
  const [questions, setQuestions] = useState<any[]>(initialData?.questions || [
    { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }
  ])

  const addQuestion = () => {
    setQuestions([...questions, { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "" }])
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const updateQuestion = (index: number, field: string, value: any) => {
    const newQuestions = [...questions]
    newQuestions[index] = { ...newQuestions[index], [field]: value }
    setQuestions(newQuestions)
  }

  const updateOption = (qIndex: number, oIndex: number, value: string) => {
    const newQuestions = [...questions]
    newQuestions[qIndex].options[oIndex] = value
    setQuestions(newQuestions)
  }

  const handleSave = () => {
    onSave({ title, description, questions })
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-bold mb-4">Quiz Details</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Quiz Title" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" />
          </div>
        </div>
      </Card>

      <div className="space-y-4">
        {questions.map((q, qIndex) => (
          <Card key={qIndex} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <h4 className="font-semibold">Question {qIndex + 1}</h4>
              <button onClick={() => removeQuestion(qIndex)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <Input 
                value={q.question} 
                onChange={e => updateQuestion(qIndex, "question", e.target.value)} 
                placeholder="Question text" 
              />
              
              <div className="pl-4 space-y-2 border-l-2 border-slate-200">
                {q.options.map((opt: string, oIndex: number) => (
                  <div key={oIndex} className="flex items-center gap-3">
                    <input 
                      type="radio" 
                      name={`correct-${qIndex}`} 
                      checked={q.correctAnswer === oIndex}
                      onChange={() => updateQuestion(qIndex, "correctAnswer", oIndex)}
                      className="w-4 h-4 text-blue-600"
                    />
                    <Input 
                      value={opt} 
                      onChange={e => updateOption(qIndex, oIndex, e.target.value)} 
                      placeholder={`Option ${oIndex + 1}`} 
                      className={q.correctAnswer === oIndex ? 'border-blue-300 bg-blue-50/30' : ''}
                    />
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 text-slate-500">Explanation (optional)</label>
                <Input 
                  value={q.explanation} 
                  onChange={e => updateQuestion(qIndex, "explanation", e.target.value)} 
                  placeholder="Why is this answer correct?" 
                />
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={addQuestion}>
          <Plus className="w-4 h-4 mr-2" />
          Add Question
        </Button>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
          Save Quiz
        </Button>
      </div>
    </div>
  )
}
