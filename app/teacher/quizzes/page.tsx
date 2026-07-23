"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  HelpCircle, Plus, Trash2, ChevronDown, ChevronRight,
  Save, Edit2, X
} from "lucide-react"

import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useToast } from "@/components/providers/ToastProvider"

type QuestionType = "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "WRITING" | "SPEAKING"

type Question = {
  id?: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  questionType: QuestionType
}

type Quiz = {
  id: string
  title: string
  description: string
  passMark: number
  timeLimit: number | null
  questions: Question[]
  type?: string
  isExamPrep?: boolean
  exam?: string | null
  section?: string | null
  level?: string | null
  lesson?: { title: string }
  module?: { title: string }
}

const examSections = [
  "Compréhension Orale",
  "Compréhension Écrite",
  "Lexique et Structure",
  "Expression Écrite",
  "Expression Orale",
]

const questionTypes: { value: QuestionType; label: string; help: string }[] = [
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice", help: "Best for listening, reading, vocabulary, and grammar MCQs." },
  { value: "FILL_IN_BLANK", label: "Fill in the Blank", help: "Best for lexique and structure grammar drills." },
  { value: "WRITING", label: "Writing Prompt", help: "Best for Expression Écrite open-ended tasks." },
  { value: "SPEAKING", label: "Speaking Prompt", help: "Best for Expression Orale role-play or presentation tasks." },
]

function emptyQuestion(): Question {
  return { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "", questionType: "MULTIPLE_CHOICE" }
}

function QuizzesContent() {
  const searchParams = useSearchParams()
  const quizIdParam = searchParams.get("quizId")
  const { showToast } = useToast()

  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Quiz>>({})
  const [saving, setSaving] = useState(false)

  // New quiz form state
  const [showNewForm, setShowNewForm] = useState(false)
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", passMark: 60, timeLimit: "", isExamPrep: false, exam: "TCF", section: examSections[0], level: "" })
  const [newQuestions, setNewQuestions] = useState<Question[]>([emptyQuestion()])
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/quizzes")
        const data = await res.json()
        setQuizzes(data)

        if (quizIdParam) {
          const targetQuiz = data.find((q: Quiz) => q.id === quizIdParam)
          if (targetQuiz) {
            setExpanded(targetQuiz.id)
            setEditing(targetQuiz.id)
            setEditForm({ ...targetQuiz })
          }
        }
      } catch {
        showToast("Failed to load quizzes.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [quizIdParam, showToast])

  const startEdit = (quiz: Quiz) => {
    setEditing(quiz.id)
    setEditForm({ ...quiz })
    setExpanded(quiz.id)
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditForm({})
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${editing}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          passMark: editForm.passMark,
          timeLimit: editForm.timeLimit || null,
          isExamPrep: Boolean(editForm.isExamPrep),
          exam: editForm.isExamPrep ? editForm.exam || null : null,
          section: editForm.isExamPrep ? editForm.section || null : null,
          level: editForm.isExamPrep ? editForm.level || null : null,
          questions: editForm.questions,
        }),
      })
      const updated = await res.json()
      setQuizzes((prev) => prev.map((q) => q.id === editing ? updated : q))
      showToast("Quiz saved successfully.", "success")
      setEditing(null)
    } catch {
      showToast("Failed to save quiz.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this quiz permanently?")) return
    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" })
      setQuizzes((prev) => prev.filter((q) => q.id !== id))
      showToast("Quiz deleted successfully.", "success")
    } catch {
      showToast("Failed to delete quiz.")
    }
  }

  const handleCreateQuiz = async () => {
    if (!newQuiz.title.trim()) { showToast("Quiz title is required."); return }
    if (newQuestions.some((q) => !q.question.trim())) { showToast("All questions must have text."); return }
    setCreating(true)
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuiz.title,
          description: newQuiz.description,
          passMark: newQuiz.passMark,
          timeLimit: newQuiz.timeLimit ? Number(newQuiz.timeLimit) : null,
          isExamPrep: newQuiz.isExamPrep,
          exam: newQuiz.isExamPrep ? newQuiz.exam : null,
          section: newQuiz.isExamPrep ? newQuiz.section : null,
          level: newQuiz.isExamPrep ? newQuiz.level : null,
          questions: newQuestions,
        }),
      })
      const created = await res.json()
      setQuizzes((prev) => [created, ...prev])
      setShowNewForm(false)
      setNewQuiz({ title: "", description: "", passMark: 60, timeLimit: "", isExamPrep: false, exam: "TCF", section: examSections[0], level: "" })
      setNewQuestions([emptyQuestion()])
      showToast("Quiz created successfully.", "success")
    } catch {
      showToast("Failed to create quiz.")
    } finally {
      setCreating(false)
    }
  }

  const updateNewQuestion = (idx: number, field: string, value: string | number | QuestionType) => {
    setNewQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  }

  const updateNewOption = (qIdx: number, oIdx: number, value: string) => {
    setNewQuestions((prev) => prev.map((q, i) => {
      if (i !== qIdx) return q
      const opts = [...q.options]
      opts[oIdx] = value
      return { ...q, options: opts }
    }))
  }

  if (loading) return (
    <div className="space-y-4 animate-in fade-in duration-700">
      {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 border border-white/10 animate-pulse rounded-2xl" />)}
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Quiz & Exercise Bank</h1>
          <p className="text-gray-500 font-medium">Create and manage assessments linked to your lessons.</p>
        </div>
        <Button className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm border border-indigo-400/30 transition-all duration-300" onClick={() => setShowNewForm(!showNewForm)}>
          {showNewForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {showNewForm ? "Cancel" : "New Quiz"}
        </Button>
      </div>

      {/* New quiz form */}
      {showNewForm && (
        <Card className="p-8 bg-white/5 backdrop-blur-md border border-indigo-500/30 rounded-3xl shadow-sm space-y-6 animate-in fade-in">
          <h3 className="font-black text-gray-900 text-xl tracking-tight">Create New Quiz</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Quiz Title *</label>
              <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" placeholder="e.g. Greetings Quiz" value={newQuiz.title} onChange={(e) => setNewQuiz({ ...newQuiz, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Pass Mark (%)</label>
              <Input className="bg-white/5 border-white/10 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" type="number" min={0} max={100} value={newQuiz.passMark} onChange={(e) => setNewQuiz({ ...newQuiz, passMark: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Description</label>
              <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" placeholder="Optional description" value={newQuiz.description} onChange={(e) => setNewQuiz({ ...newQuiz, description: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-500 mb-2">Time Limit (minutes, optional)</label>
              <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" type="number" min={1} placeholder="No limit" value={newQuiz.timeLimit} onChange={(e) => setNewQuiz({ ...newQuiz, timeLimit: e.target.value })} />
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-4">
            <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
              <input
                type="checkbox"
                checked={newQuiz.isExamPrep}
                onChange={(e) => setNewQuiz({ ...newQuiz, isExamPrep: e.target.checked })}
                className="w-4 h-4 accent-indigo-500"
              />
              Show this quiz on the public TCF/TEF Exam Prep page
            </label>
            {newQuiz.isExamPrep && (
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Exam</label>
                  <select
                    value={newQuiz.exam}
                    onChange={(e) => setNewQuiz({ ...newQuiz, exam: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="TCF">TCF</option>
                    <option value="TEF">TEF</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Section</label>
                  <select
                    value={newQuiz.section}
                    onChange={(e) => setNewQuiz({ ...newQuiz, section: e.target.value })}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {examSections.map((section) => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-500 mb-2">Level</label>
                  <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" placeholder="A2-B1" value={newQuiz.level} onChange={(e) => setNewQuiz({ ...newQuiz, level: e.target.value })} />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-white/10">
            <h4 className="font-bold text-gray-900 text-lg">Questions</h4>
            {newQuestions.map((q, qIdx) => (
              <div key={qIdx} className="text-white border border-white/5 rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-wider">Question {qIdx + 1}</span>
                  {newQuestions.length > 1 && (
                    <button onClick={() => setNewQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                      className="text-gray-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"><X className="w-4 h-4" /></button>
                  )}
                </div>
                <div className="grid md:grid-cols-[220px_1fr] gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Question Type</label>
                    <select
                      value={q.questionType}
                      onChange={(e) => updateNewQuestion(qIdx, "questionType", e.target.value as QuestionType)}
                      className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    >
                      {questionTypes.map((type) => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-gray-500 mt-2">{questionTypes.find((type) => type.value === q.questionType)?.help}</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-2">Question / Prompt</label>
                    <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" placeholder="Question text or open-ended prompt" value={q.question} onChange={(e) => updateNewQuestion(qIdx, "question", e.target.value)} />
                  </div>
                </div>
                {(q.questionType === "MULTIPLE_CHOICE" || q.questionType === "FILL_IN_BLANK") ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {q.options.map((opt, oIdx) => (
                      <div key={oIdx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                        <input type="radio" name={`correct-${qIdx}`} checked={q.correctAnswer === oIdx}
                          onChange={() => updateNewQuestion(qIdx, "correctAnswer", oIdx)}
                          className="w-4 h-4 accent-indigo-500 cursor-pointer" title="Mark as correct" />
                        <Input className="bg-transparent border-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-500 h-8 px-1" placeholder={`Option ${oIdx + 1}`} value={opt} onChange={(e) => updateNewOption(qIdx, oIdx, e.target.value)} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium text-amber-700">
                    This is an open-ended {q.questionType === "WRITING" ? "writing" : "speaking"} task. Students will see the prompt instead of MCQ options.
                  </div>
                )}
                <div>
                  <textarea
                    placeholder="Explanation / Solution (Optional)"
                    value={q.explanation || ""}
                    onChange={(e) => updateNewQuestion(qIdx, "explanation", e.target.value)}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-y"
                  />
                </div>
                <div className="text-xs font-medium text-gray-500">Use MCQ/fill-in-the-blank for auto-graded sections; use writing/speaking prompts for teacher or rubric review.</div>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={() => setNewQuestions((prev) => [...prev, emptyQuestion()])} className="bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-900 rounded-xl px-4 font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> Add Question
            </Button>
          </div>

          <div className="flex justify-end pt-4">
            <Button className="bg-indigo-500 hover:bg-indigo-600 text-gray-900 font-bold px-8 py-2.5 rounded-xl shadow-sm border border-indigo-400/30 transition-all duration-300" disabled={creating} onClick={handleCreateQuiz}>
              <Save className="w-5 h-5 mr-2" />
              {creating ? "Creating..." : "Create Quiz"}
            </Button>
          </div>
        </Card>
      )}

      {/* Quiz list */}
      {quizzes.length === 0 && !showNewForm ? (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center backdrop-blur-md">
          <div className="w-20 h-20 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">No quizzes yet</h3>
          <p className="text-gray-500 font-medium">Create your first quiz to get started.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id} className="bg-white/5 backdrop-blur-md border-white/10 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
              <div
                className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => setExpanded(expanded === quiz.id ? null : quiz.id)}
              >
                <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl flex items-center justify-center shrink-0">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">{quiz.title}</h3>
                    {quiz.type === 'EXERCISE' && (
                      <span className="text-[10px] px-2 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-md uppercase font-bold tracking-wider">Exercise</span>
                    )}
                    {quiz.isExamPrep && (
                      <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-md uppercase font-bold tracking-wider">Exam Prep</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-500">{quiz.questions.length} questions · Pass: {quiz.passMark}%</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); startEdit(quiz) }}
                    className="p-2 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors" title="Edit">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); handleDelete(quiz.id) }}
                    className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 border border-white/10 ml-2">
                    {expanded === quiz.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {expanded === quiz.id && (
                <div className="border-t border-white/10 p-6 text-white space-y-6">
                  {editing === quiz.id ? (
                    <div className="space-y-6 animate-in fade-in">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Title</label>
                          <Input className="bg-white/5 border-white/10 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-gray-900 mb-2">Pass Mark (%)</label>
                          <Input className="bg-white/5 border-white/10 text-gray-900 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" type="number" value={editForm.passMark || 60} onChange={(e) => setEditForm({ ...editForm, passMark: Number(e.target.value) })} />
                        </div>
                      </div>

                      <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/5 p-5 space-y-4">
                        <label className="flex items-center gap-3 text-sm font-bold text-gray-700">
                          <input
                            type="checkbox"
                            checked={Boolean(editForm.isExamPrep)}
                            onChange={(e) => setEditForm({ ...editForm, isExamPrep: e.target.checked })}
                            className="w-4 h-4 accent-indigo-500"
                          />
                          Show this quiz on the public TCF/TEF Exam Prep page
                        </label>
                        {editForm.isExamPrep && (
                          <div className="grid md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">Exam</label>
                              <select
                                value={editForm.exam || "TCF"}
                                onChange={(e) => setEditForm({ ...editForm, exam: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                <option value="TCF">TCF</option>
                                <option value="TEF">TEF</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">Section</label>
                              <select
                                value={editForm.section || examSections[0]}
                                onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                              >
                                {examSections.map((section) => (
                                  <option key={section} value={section}>{section}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-sm font-bold text-gray-900 mb-2">Level</label>
                              <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" placeholder="A2-B1" value={editForm.level || ""} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 mt-6">
                        <h4 className="font-bold text-gray-900 text-lg">Questions</h4>
                        {editForm.questions?.map((q, qIdx) => (
                          <div key={qIdx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1.5 rounded-lg border border-indigo-500/20 uppercase tracking-wider">Question {qIdx + 1}</span>
                              {editForm.questions!.length > 1 && (
                                <button onClick={() => setEditForm({ ...editForm, questions: editForm.questions!.filter((_, i) => i !== qIdx) })}
                                  className="text-gray-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"><X className="w-4 h-4" /></button>
                              )}
                            </div>
                            <div className="grid md:grid-cols-[220px_1fr] gap-4">
                              <div>
                                <label className="block text-xs font-bold text-gray-900 mb-2">Question Type</label>
                                <select
                                  value={q.questionType || "MULTIPLE_CHOICE"}
                                  onChange={(e) => {
                                    const newQ = [...editForm.questions!];
                                    newQ[qIdx] = { ...newQ[qIdx], questionType: e.target.value as QuestionType };
                                    setEditForm({ ...editForm, questions: newQ });
                                  }}
                                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                >
                                  {questionTypes.map((type) => (
                                    <option key={type.value} value={type.value}>{type.label}</option>
                                  ))}
                                </select>
                                <p className="text-[11px] text-gray-500 mt-2">{questionTypes.find((type) => type.value === (q.questionType || "MULTIPLE_CHOICE"))?.help}</p>
                              </div>
                              <div>
                                <label className="block text-xs font-bold text-gray-900 mb-2">Question / Prompt</label>
                                <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-11" placeholder="Question text or open-ended prompt" value={q.question} onChange={(e) => {
                                  const newQ = [...editForm.questions!];
                                  newQ[qIdx] = { ...newQ[qIdx], question: e.target.value };
                                  setEditForm({ ...editForm, questions: newQ });
                                }} />
                              </div>
                            </div>
                            {((q.questionType || "MULTIPLE_CHOICE") === "MULTIPLE_CHOICE" || (q.questionType || "MULTIPLE_CHOICE") === "FILL_IN_BLANK") ? (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {q.options.map((opt, oIdx) => (
                                  <div key={oIdx} className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10">
                                    <input type="radio" name={`edit-correct-${qIdx}`} checked={q.correctAnswer === oIdx}
                                      onChange={() => {
                                        const newQ = [...editForm.questions!];
                                        newQ[qIdx] = { ...newQ[qIdx], correctAnswer: oIdx };
                                        setEditForm({ ...editForm, questions: newQ });
                                      }}
                                      className="w-4 h-4 accent-indigo-500 cursor-pointer" title="Mark as correct" />
                                    <Input className="bg-transparent border-none focus-visible:ring-0 text-gray-900 placeholder:text-gray-500 h-8 px-1" placeholder={`Option ${oIdx + 1}`} value={opt} onChange={(e) => {
                                      const newQ = [...editForm.questions!];
                                      const newOpts = [...newQ[qIdx].options];
                                      newOpts[oIdx] = e.target.value;
                                      newQ[qIdx] = { ...newQ[qIdx], options: newOpts };
                                      setEditForm({ ...editForm, questions: newQ });
                                    }} />
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs font-medium text-amber-700">
                                This is an open-ended {(q.questionType || "WRITING") === "WRITING" ? "writing" : "speaking"} task. Students will see the prompt instead of MCQ options.
                              </div>
                            )}
                            <div>
                              <textarea
                                placeholder="Explanation / Solution (Optional)"
                                value={q.explanation || ""}
                                onChange={(e) => {
                                  const newQ = [...editForm.questions!];
                                  newQ[qIdx] = { ...newQ[qIdx], explanation: e.target.value };
                                  setEditForm({ ...editForm, questions: newQ });
                                }}
                                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all min-h-[80px] resize-y"
                              />
                            </div>
                          </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setEditForm({ ...editForm, questions: [...(editForm.questions || []), emptyQuestion()] })} className="bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-900 rounded-xl px-4 font-bold">
                          <Plus className="w-4 h-4 mr-1.5" /> Add Question
                        </Button>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                        <Button variant="outline" size="sm" onClick={cancelEdit} className="bg-transparent border-white/10 text-gray-500 hover:bg-white/5 hover:text-gray-900 rounded-xl px-5 font-bold">Cancel</Button>
                        <Button size="sm" className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-6 rounded-xl shadow-sm border border-indigo-400/30" disabled={saving} onClick={handleSaveEdit}>
                          <Save className="w-4 h-4 mr-2" />
                          {saving ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {quiz.questions.map((q, i) => (
                        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                          <p className="font-bold text-gray-900 mb-4 text-base"><span className="text-indigo-400 mr-1">{i + 1}.</span> {q.question}</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className={`text-sm px-4 py-3 rounded-xl border ${oIdx === q.correctAnswer ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold" : "bg-white/5 text-gray-500 border-white/10"}`}>
                                {oIdx === q.correctAnswer && "✓ "}{opt}
                              </div>
                            ))}
                          </div>
                          {q.explanation && (
                            <div className="mt-4 text-sm bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20 text-indigo-300 leading-relaxed">
                              <span className="font-bold text-indigo-400 block mb-1">Solution/Explanation:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeacherQuizzesPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4 animate-in fade-in duration-700">
        {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 border border-white/10 animate-pulse rounded-2xl" />)}
      </div>
    }>
      <QuizzesContent />
    </Suspense>
  )
}
