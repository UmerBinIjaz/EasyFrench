"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    HelpCircle, Plus, Trash2, ChevronDown, ChevronRight,
    Save, Edit2, X, FileText, CheckCircle, Clock, Users,
    ArrowUpDown, ListOrdered, Type, AlignLeft, ArrowLeftRight, ArrowRight
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import { Suspense } from "react"
import { useToast } from "@/components/providers/ToastProvider"

type QuestionType = "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "WRITING" | "MATCHING"

type Question = {
    id?: string
    question: string
    options: any[]
    correctAnswer: number
    explanation: string
    questionType: QuestionType
}

type Exercise = {
    id: string
    title: string
    description: string
    questions: Question[]
    type?: string
    lesson?: { title: string }
    module?: { title: string }
}

function emptyQuestion(): Question {
    return { question: "", options: ["", "", "", ""], correctAnswer: 0, explanation: "", questionType: "WRITING" }
}

const questionTypeOptions: { value: QuestionType; label: string; icon: React.ReactNode; description: string }[] = [
    { value: "MULTIPLE_CHOICE", label: "Multiple Choice", icon: <ListOrdered className="w-4 h-4" />, description: "Choose the correct answer from options" },
    { value: "FILL_IN_BLANK", label: "Fill in the Blank", icon: <Type className="w-4 h-4" />, description: "Type the correct word or phrase" },
    { value: "MATCHING", label: "Match the Column", icon: <ArrowLeftRight className="w-4 h-4" />, description: "Match left items to their correct right items" },
    { value: "WRITING", label: "Written Answer", icon: <AlignLeft className="w-4 h-4" />, description: "Open-ended writing prompt" },
]

function ExercisesContent() {
    const searchParams = useSearchParams()
    const exerciseIdParam = searchParams.get("exerciseId")
    const { showToast } = useToast()

    const [exercises, setExercises] = useState<Exercise[]>([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState<string | null>(null)
    const [editing, setEditing] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Exercise>>({})
    const [saving, setSaving] = useState(false)

    // New exercise form state
    const [showNewForm, setShowNewForm] = useState(false)
    const [newExercise, setNewExercise] = useState({ title: "", description: "" })
    const [newQuestions, setNewQuestions] = useState<Question[]>([emptyQuestion()])
    const [creating, setCreating] = useState(false)

    // Submissions view
    const [submissions, setSubmissions] = useState<any[]>([])
    const [showSubmissions, setShowSubmissions] = useState<string | null>(null)
    const [submissionsLoading, setSubmissionsLoading] = useState(false)
    const [gradingData, setGradingData] = useState<Record<string, { scores: { questionIndex: number; score: number; feedback: string }[]; totalScore: number }>>({})

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch("/api/exercises/crud")
                const data = await res.json()
                setExercises(data)

                if (exerciseIdParam) {
                    const target = data.find((q: Exercise) => q.id === exerciseIdParam)
                    if (target) {
                        setExpanded(target.id)
                        setEditing(target.id)
                        setEditForm({ ...target })
                    }
                }
            } catch {
                showToast("Failed to load exercises.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [exerciseIdParam, showToast])

    const startEdit = (ex: Exercise) => {
        setEditing(ex.id)
        setEditForm({ ...ex })
        setExpanded(ex.id)
    }

    const cancelEdit = () => {
        setEditing(null)
        setEditForm({})
    }

    const handleSaveEdit = async () => {
        if (!editing) return
        setSaving(true)
        try {
            const res = await fetch(`/api/exercises/crud/${editing}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: editForm.title,
                    description: editForm.description,
                    questions: editForm.questions,
                }),
            })
            const updated = await res.json()
            setExercises((prev) => prev.map((q) => q.id === editing ? updated : q))
            showToast("Exercise saved successfully.", "success")
            setEditing(null)
        } catch {
            showToast("Failed to save exercise.")
        } finally {
            setSaving(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Delete this exercise permanently?")) return
        try {
            await fetch(`/api/exercises/crud/${id}`, { method: "DELETE" })
            setExercises((prev) => prev.filter((q) => q.id !== id))
            showToast("Exercise deleted successfully.", "success")
        } catch {
            showToast("Failed to delete exercise.")
        }
    }

    const handleCreateExercise = async () => {
        if (!newExercise.title.trim()) { showToast("Exercise title is required."); return }
        if (newQuestions.some((q) => !q.question.trim())) { showToast("All questions must have text."); return }
        setCreating(true)
        try {
            const res = await fetch("/api/exercises/crud", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: newExercise.title,
                    description: newExercise.description,
                    questions: newQuestions,
                }),
            })
            const created = await res.json()
            setExercises((prev) => [created, ...prev])
            setShowNewForm(false)
            setNewExercise({ title: "", description: "" })
            setNewQuestions([emptyQuestion()])
            showToast("Exercise created successfully.", "success")
        } catch {
            showToast("Failed to create exercise.")
        } finally {
            setCreating(false)
        }
    }

    const updateNewQuestion = (idx: number, field: string, value: string | number) => {
        setNewQuestions((prev) => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
    }

    const updateNewQuestionOption = (qIdx: number, oIdx: number, value: string) => {
        setNewQuestions((prev) => prev.map((q, i) => {
            if (i !== qIdx) return q
            const newOptions = [...q.options]
            newOptions[oIdx] = value
            return { ...q, options: newOptions }
        }))
    }

    const handleNewQuestionTypeChange = (qIdx: number, type: QuestionType) => {
        setNewQuestions((prev) => prev.map((q, i) => {
            if (i !== qIdx) return q
            const newQ: Question = {
                ...q,
                questionType: type,
                options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : type === "FILL_IN_BLANK" ? [""] : type === "MATCHING" ? [{ left: "", right: "" }, { left: "", right: "" }] : [],
                correctAnswer: 0,
                explanation: "",
            }
            return newQ
        }))
    }

    const updateNewMatchingPair = (qIdx: number, pIdx: number, field: "left" | "right", value: string) => {
        setNewQuestions((prev) => prev.map((q, i) => {
            if (i !== qIdx) return q
            const newOptions = (q.options as any[]).map((p: any, j: number) => j === pIdx ? { ...p, [field]: value } : p)
            return { ...q, options: newOptions }
        }))
    }

    const addNewMatchingPair = (qIdx: number) => {
        setNewQuestions((prev) => prev.map((q, i) => {
            if (i !== qIdx) return q
            return { ...q, options: [...(q.options as any[]), { left: "", right: "" }] }
        }))
    }

    const removeNewMatchingPair = (qIdx: number, pIdx: number) => {
        setNewQuestions((prev) => prev.map((q, i) => {
            if (i !== qIdx) return q
            return { ...q, options: (q.options as any[]).filter((_: any, j: number) => j !== pIdx) }
        }))
    }

    const updateEditQuestionType = (qIdx: number, type: QuestionType) => {
        if (!editForm.questions) return
        const newQ = [...editForm.questions]
        newQ[qIdx] = {
            ...newQ[qIdx],
            questionType: type,
            options: type === "MULTIPLE_CHOICE" ? ["", "", "", ""] : type === "FILL_IN_BLANK" ? [""] : type === "MATCHING" ? [{ left: "", right: "" }, { left: "", right: "" }] : [],
            correctAnswer: 0,
            explanation: newQ[qIdx].explanation || "",
        }
        setEditForm({ ...editForm, questions: newQ })
    }

    const updateEditMatchingPair = (qIdx: number, pIdx: number, field: "left" | "right", value: string) => {
        if (!editForm.questions) return
        const newQ = [...editForm.questions]
        const newOptions = (newQ[qIdx].options as any[]).map((p: any, j: number) => j === pIdx ? { ...p, [field]: value } : p)
        newQ[qIdx] = { ...newQ[qIdx], options: newOptions }
        setEditForm({ ...editForm, questions: newQ })
    }

    const addEditMatchingPair = (qIdx: number) => {
        if (!editForm.questions) return
        const newQ = [...editForm.questions]
        newQ[qIdx] = { ...newQ[qIdx], options: [...(newQ[qIdx].options as any[]), { left: "", right: "" }] }
        setEditForm({ ...editForm, questions: newQ })
    }

    const removeEditMatchingPair = (qIdx: number, pIdx: number) => {
        if (!editForm.questions) return
        const newQ = [...editForm.questions]
        newQ[qIdx] = { ...newQ[qIdx], options: (newQ[qIdx].options as any[]).filter((_: any, j: number) => j !== pIdx) }
        setEditForm({ ...editForm, questions: newQ })
    }

    const loadSubmissions = async (exerciseId: string) => {
        if (showSubmissions === exerciseId) {
            setShowSubmissions(null)
            return
        }
        setSubmissionsLoading(true)
        setShowSubmissions(exerciseId)
        try {
            const res = await fetch(`/api/exercises?quizId=${exerciseId}`)
            const data = await res.json()
            setSubmissions(data)
            // Init grading data
            const gd: Record<string, any> = {}
            data.forEach((s: any) => {
                const questions = exercises.find(e => e.id === exerciseId)?.questions || []
                gd[s.id] = {
                    scores: questions.map((q: any, i: number) => {
                        const existing = s.scores?.find((sc: any) => sc.questionIndex === i)
                        return { questionIndex: i, score: existing?.score || 0, feedback: existing?.feedback || "" }
                    }),
                    totalScore: s.totalScore || 0,
                }
            })
            setGradingData(gd)
        } catch {
            showToast("Failed to load submissions.")
        } finally {
            setSubmissionsLoading(false)
        }
    }

    const handleGrade = async (submissionId: string) => {
        const data = gradingData[submissionId]
        if (!data) return
        const totalScore = data.scores.reduce((sum, s) => sum + s.score, 0)
        try {
            const res = await fetch("/api/exercises", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ submissionId, scores: data.scores, totalScore }),
            })
            if (res.ok) {
                showToast("Submission graded successfully.", "success")
                setSubmissions((prev) => prev.map((s) =>
                    s.id === submissionId ? { ...s, scores: data.scores, totalScore, status: "GRADED" } : s
                ))
            } else {
                showToast("Failed to grade submission.")
            }
        } catch {
            showToast("Failed to grade submission.")
        }
    }

    const updateScore = (submissionId: string, qIdx: number, value: number) => {
        setGradingData((prev) => {
            const submission = prev[submissionId]
            if (!submission) return prev
            const newScores = submission.scores.map((s) =>
                s.questionIndex === qIdx ? { ...s, score: value } : s
            )
            return { ...prev, [submissionId]: { ...submission, scores: newScores } }
        })
    }

    const updateFeedback = (submissionId: string, qIdx: number, value: string) => {
        setGradingData((prev) => {
            const submission = prev[submissionId]
            if (!submission) return prev
            const newScores = submission.scores.map((s) =>
                s.questionIndex === qIdx ? { ...s, feedback: value } : s
            )
            return { ...prev, [submissionId]: { ...submission, scores: newScores } }
        })
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
                    <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Exercise Bank</h1>
                    <p className="text-gray-500 font-medium">Create and manage written exercises for your lessons.</p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold px-5 py-2.5 rounded-xl shadow-sm border border-emerald-400/30 transition-all duration-300" onClick={() => setShowNewForm(!showNewForm)}>
                    {showNewForm ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                    {showNewForm ? "Cancel" : "New Exercise"}
                </Button>
            </div>

            {/* New exercise form */}
            {showNewForm && (
                <Card className="p-8 bg-white/5 backdrop-blur-md border border-emerald-500/30 rounded-3xl shadow-sm space-y-6 animate-in fade-in">
                    <h3 className="font-black text-gray-900 text-xl tracking-tight">Create New Exercise</h3>
                    <div className="grid md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">Exercise Title *</label>
                            <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl h-11" placeholder="e.g. Greetings Writing Practice" value={newExercise.title} onChange={(e) => setNewExercise({ ...newExercise, title: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-500 mb-2">Description</label>
                            <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl h-11" placeholder="Optional description" value={newExercise.description} onChange={(e) => setNewExercise({ ...newExercise, description: e.target.value })} />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <h4 className="font-bold text-gray-900 text-lg">Questions</h4>
                        {newQuestions.map((q, qIdx) => (
                            <div key={qIdx} className="bg-white/5 border border-white/5 rounded-2xl p-6 space-y-4">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-wider">Question {qIdx + 1}</span>
                                    <div className="flex items-center gap-2">
                                        {newQuestions.length > 1 && (
                                            <button onClick={() => setNewQuestions((prev) => prev.filter((_, i) => i !== qIdx))}
                                                className="text-gray-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"><X className="w-4 h-4" /></button>
                                        )}
                                    </div>
                                </div>

                                {/* Question Type Selector */}
                                <div className="flex flex-wrap gap-2">
                                    {questionTypeOptions.map((opt) => (
                                        <button
                                            key={opt.value}
                                            type="button"
                                            onClick={() => handleNewQuestionTypeChange(qIdx, opt.value)}
                                            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${q.questionType === opt.value
                                                ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                                                : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300"
                                                }`}
                                        >
                                            {opt.icon} {opt.label}
                                        </button>
                                    ))}
                                </div>

                                <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl h-11"
                                    placeholder={
                                        q.questionType === "MULTIPLE_CHOICE" ? "Enter your question..." :
                                            q.questionType === "FILL_IN_BLANK" ? "Enter the sentence with a blank (e.g. The capital of France is ___ )" :
                                                q.questionType === "MATCHING" ? "Enter the instruction (e.g. Match each term with its correct definition)" :
                                                "Enter the writing prompt..."
                                    }
                                    value={q.question}
                                    onChange={(e) => updateNewQuestion(qIdx, "question", e.target.value)} />

                                {/* MULTIPLE_CHOICE options */}
                                {q.questionType === "MULTIPLE_CHOICE" && (
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-gray-500 block">Answer Options</label>
                                        {q.options.map((opt, oIdx) => (
                                            <div key={oIdx} className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name={`new-mc-${qIdx}`}
                                                    checked={q.correctAnswer === oIdx}
                                                    onChange={() => updateNewQuestion(qIdx, "correctAnswer", oIdx)}
                                                    className="accent-emerald-500"
                                                />
                                                <span className="text-xs text-gray-500 w-5 font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                                <Input
                                                    className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm flex-1"
                                                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                    value={opt}
                                                    onChange={(e) => updateNewQuestionOption(qIdx, oIdx, e.target.value)}
                                                />
                                                {q.correctAnswer === oIdx && (
                                                    <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Correct</span>
                                                )}
                                            </div>
                                        ))}
                                        <p className="text-[10px] text-gray-500 mt-1">Select the radio button next to the correct answer.</p>
                                    </div>
                                )}

                                {/* FILL_IN_BLANK - correct answer */}
                                {q.questionType === "FILL_IN_BLANK" && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Correct Answer</label>
                                        <Input
                                            className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm"
                                            placeholder="The correct word or phrase to fill in the blank"
                                            value={q.options[0] || ""}
                                            onChange={(e) => updateNewQuestionOption(qIdx, 0, e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* MATCHING - pairs builder */}
                                {q.questionType === "MATCHING" && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <label className="text-xs font-bold text-gray-500">Left Column (Terms)</label>
                                            <label className="text-xs font-bold text-gray-500">Right Column (Definitions)</label>
                                        </div>
                                        {(q.options as any[]).map((pair: any, pIdx: number) => (
                                            <div key={pIdx} className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-emerald-400 w-5 shrink-0">{String.fromCharCode(65 + pIdx)}.</span>
                                                <Input
                                                    className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm flex-1"
                                                    placeholder={`Term ${pIdx + 1}`}
                                                    value={pair.left || ""}
                                                    onChange={(e) => updateNewMatchingPair(qIdx, pIdx, "left", e.target.value)}
                                                />
                                                <span className="text-gray-400 shrink-0">→</span>
                                                <Input
                                                    className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm flex-1"
                                                    placeholder={`Definition ${pIdx + 1}`}
                                                    value={pair.right || ""}
                                                    onChange={(e) => updateNewMatchingPair(qIdx, pIdx, "right", e.target.value)}
                                                />
                                                {(q.options as any[]).length > 2 && (
                                                    <button onClick={() => removeNewMatchingPair(qIdx, pIdx)} className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                                                )}
                                            </div>
                                        ))}
                                        <button onClick={() => addNewMatchingPair(qIdx)} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1">
                                            <Plus className="w-3.5 h-3.5" /> Add Pair
                                        </button>
                                        <p className="text-[10px] text-gray-500">Students will see the right-column items shuffled and drag/type them to match the left-column terms.</p>
                                    </div>
                                )}

                                {/* WRITING - model answer */}
                                {q.questionType === "WRITING" && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Model Answer / Rubric (optional)</label>
                                        <textarea
                                            placeholder="Provide expected answer or grading rubric for this question..."
                                            value={q.explanation || ""}
                                            onChange={(e) => updateNewQuestion(qIdx, "explanation", e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[80px] resize-y"
                                        />
                                    </div>
                                )}
                            </div>
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setNewQuestions((prev) => [...prev, emptyQuestion()])} className="bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-900 rounded-xl px-4 font-bold">
                            <Plus className="w-4 h-4 mr-1.5" /> Add Question
                        </Button>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button className="bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold px-8 py-2.5 rounded-xl shadow-sm border border-emerald-400/30 transition-all duration-300" disabled={creating} onClick={handleCreateExercise}>
                            <Save className="w-5 h-5 mr-2" />
                            {creating ? "Creating..." : "Create Exercise"}
                        </Button>
                    </div>
                </Card>
            )}

            {/* Exercise list */}
            {exercises.length === 0 && !showNewForm ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center backdrop-blur-md">
                    <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-10 h-10" />
                    </div>
                    <h3 className="text-xl font-black text-gray-900 mb-2 tracking-tight">No exercises yet</h3>
                    <p className="text-gray-500 font-medium">Create your first writing exercise to get started.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {exercises.map((exercise) => (
                        <Card key={exercise.id} className="bg-white/5 backdrop-blur-md border-white/10 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
                            <div
                                className="flex items-center gap-4 px-6 py-5 cursor-pointer hover:bg-white/5 transition-colors"
                                onClick={() => {
                                    if (expanded === exercise.id) {
                                        setExpanded(null)
                                        setShowSubmissions(null)
                                    } else {
                                        setExpanded(exercise.id)
                                    }
                                }}
                            >
                                <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="text-lg font-bold text-gray-900 tracking-tight truncate">{exercise.title}</h3>
                                        <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md uppercase font-bold tracking-wider">Exercise</span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-500">{(exercise.questions?.length || 0)} prompts</p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <button onClick={(e) => { e.stopPropagation(); startEdit(exercise) }}
                                        className="p-2 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-lg transition-colors" title="Edit">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDelete(exercise.id) }}
                                        className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors" title="Delete">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-gray-400 border border-white/10 ml-2">
                                        {expanded === exercise.id ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    </div>
                                </div>
                            </div>

                            {expanded === exercise.id && (
                                <div className="border-t border-white/10 p-6 text-white space-y-6">
                                    {editing === exercise.id ? (
                                        <div className="space-y-6 animate-in fade-in">
                                            <div className="grid md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-bold text-gray-900 mb-2">Title</label>
                                                    <Input className="bg-white/5 border-white/10 text-gray-900 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl h-11" value={editForm.title || ""} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} />
                                                </div>
                                            </div>

                                            <div className="space-y-4 mt-6">
                                                <h4 className="font-bold text-gray-900 text-lg">Questions</h4>
                                                {editForm.questions?.map((q, qIdx) => (
                                                    <div key={qIdx} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 uppercase tracking-wider">Question {qIdx + 1}</span>
                                                            {editForm.questions!.length > 1 && (
                                                                <button onClick={() => setEditForm({ ...editForm, questions: editForm.questions!.filter((_, i) => i !== qIdx) })}
                                                                    className="text-gray-500 hover:text-rose-400 p-2 rounded-lg hover:bg-rose-500/10 transition-colors"><X className="w-4 h-4" /></button>
                                                            )}
                                                        </div>

                                                        {/* Question Type Selector */}
                                                        <div className="flex flex-wrap gap-2">
                                                            {questionTypeOptions.map((opt) => (
                                                                <button
                                                                    key={opt.value}
                                                                    type="button"
                                                                    onClick={() => updateEditQuestionType(qIdx, opt.value)}
                                                                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${q.questionType === opt.value
                                                                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm"
                                                                        : "bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-300"
                                                                        }`}
                                                                >
                                                                    {opt.icon} {opt.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <Input className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl h-11" placeholder="Question text" value={q.question} onChange={(e) => {
                                                            const newQ = [...editForm.questions!];
                                                            newQ[qIdx] = { ...newQ[qIdx], question: e.target.value };
                                                            setEditForm({ ...editForm, questions: newQ });
                                                        }} />

                                                        {/* MULTIPLE_CHOICE options */}
                                                        {q.questionType === "MULTIPLE_CHOICE" && (
                                                            <div className="space-y-2">
                                                                <label className="text-xs font-bold text-gray-500 block">Answer Options</label>
                                                                {q.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className="flex items-center gap-2">
                                                                        <input
                                                                            type="radio"
                                                                            name={`edit-mc-${qIdx}`}
                                                                            checked={q.correctAnswer === oIdx}
                                                                            onChange={() => {
                                                                                const newQ = [...editForm.questions!];
                                                                                newQ[qIdx] = { ...newQ[qIdx], correctAnswer: oIdx };
                                                                                setEditForm({ ...editForm, questions: newQ });
                                                                            }}
                                                                            className="accent-emerald-500"
                                                                        />
                                                                        <span className="text-xs text-gray-500 w-5 font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                                                        <Input
                                                                            className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm flex-1"
                                                                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                                                                            value={opt}
                                                                            onChange={(e) => {
                                                                                const newQ = [...editForm.questions!];
                                                                                const newOptions = [...newQ[qIdx].options];
                                                                                newOptions[oIdx] = e.target.value;
                                                                                newQ[qIdx] = { ...newQ[qIdx], options: newOptions };
                                                                                setEditForm({ ...editForm, questions: newQ });
                                                                            }}
                                                                        />
                                                                        {q.correctAnswer === oIdx && (
                                                                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">Correct</span>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <p className="text-[10px] text-gray-500 mt-1">Select the radio button next to the correct answer.</p>
                                                            </div>
                                                        )}

                                                        {/* FILL_IN_BLANK - correct answer */}
                                                        {q.questionType === "FILL_IN_BLANK" && (
                                                            <div>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">Correct Answer</label>
                                                                <Input
                                                                    className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm"
                                                                    placeholder="The correct word or phrase"
                                                                    value={q.options[0] || ""}
                                                                    onChange={(e) => {
                                                                        const newQ = [...editForm.questions!];
                                                                        newQ[qIdx] = { ...newQ[qIdx], options: [e.target.value] };
                                                                        setEditForm({ ...editForm, questions: newQ });
                                                                    }}
                                                                />
                                                            </div>
                                                        )}

                                                        {/* MATCHING - pairs builder */}
                                                        {q.questionType === "MATCHING" && (
                                                            <div className="space-y-3">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <label className="text-xs font-bold text-gray-500">Left Column (Terms)</label>
                                                                    <label className="text-xs font-bold text-gray-500">Right Column (Definitions)</label>
                                                                </div>
                                                                {(q.options as any[]).map((pair: any, pIdx: number) => (
                                                                    <div key={pIdx} className="flex items-center gap-2">
                                                                        <span className="text-xs font-bold text-emerald-400 w-5 shrink-0">{String.fromCharCode(65 + pIdx)}.</span>
                                                                        <Input
                                                                            className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm flex-1"
                                                                            placeholder={`Term ${pIdx + 1}`}
                                                                            value={pair.left || ""}
                                                                            onChange={(e) => updateEditMatchingPair(qIdx, pIdx, "left", e.target.value)}
                                                                        />
                                                                        <span className="text-gray-400 shrink-0">→</span>
                                                                        <Input
                                                                            className="bg-white/5 border-white/10 text-gray-900 placeholder:text-gray-500 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-lg h-9 text-sm flex-1"
                                                                            placeholder={`Definition ${pIdx + 1}`}
                                                                            value={pair.right || ""}
                                                                            onChange={(e) => updateEditMatchingPair(qIdx, pIdx, "right", e.target.value)}
                                                                        />
                                                                        {(q.options as any[]).length > 2 && (
                                                                            <button onClick={() => removeEditMatchingPair(qIdx, pIdx)} className="text-gray-500 hover:text-rose-400 p-1 rounded transition-colors shrink-0"><X className="w-3.5 h-3.5" /></button>
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <button onClick={() => addEditMatchingPair(qIdx)} className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 mt-1">
                                                                    <Plus className="w-3.5 h-3.5" /> Add Pair
                                                                </button>
                                                            </div>
                                                        )}

                                                        {/* WRITING - model answer */}
                                                        {q.questionType === "WRITING" && (
                                                            <div>
                                                                <textarea
                                                                    placeholder="Model answer / grading rubric"
                                                                    value={q.explanation || ""}
                                                                    onChange={(e) => {
                                                                        const newQ = [...editForm.questions!];
                                                                        newQ[qIdx] = { ...newQ[qIdx], explanation: e.target.value };
                                                                        setEditForm({ ...editForm, questions: newQ });
                                                                    }}
                                                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all min-h-[80px] resize-y"
                                                                />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                                <Button variant="outline" size="sm" onClick={() => setEditForm({ ...editForm, questions: [...(editForm.questions || []), emptyQuestion()] })} className="bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-900 rounded-xl px-4 font-bold">
                                                    <Plus className="w-4 h-4 mr-1.5" /> Add Question
                                                </Button>
                                            </div>

                                            <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                                                <Button variant="outline" size="sm" onClick={cancelEdit} className="bg-transparent border-white/10 text-gray-500 hover:bg-white/5 hover:text-gray-900 rounded-xl px-5 font-bold">Cancel</Button>
                                                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold px-6 rounded-xl shadow-sm border border-emerald-400/30" disabled={saving} onClick={handleSaveEdit}>
                                                    <Save className="w-4 h-4 mr-2" />
                                                    {saving ? "Saving..." : "Save Changes"}
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* View questions */}
                                            <div className="space-y-4">
                                                <h4 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-emerald-400" />
                                                    Questions
                                                </h4>
                                                {(exercise.questions || []).map((q, i) => (
                                                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <span className="text-emerald-400 font-bold text-sm">{i + 1}.</span>
                                                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${q.questionType === "MULTIPLE_CHOICE" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                                                                q.questionType === "FILL_IN_BLANK" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" :
                                                                    q.questionType === "MATCHING" ? "bg-orange-500/10 text-orange-400 border border-orange-500/20" :
                                                                    "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                                                }`}>
                                                                {q.questionType === "MULTIPLE_CHOICE" ? "Multiple Choice" :
                                                                    q.questionType === "FILL_IN_BLANK" ? "Fill in the Blank" :
                                                                        q.questionType === "MATCHING" ? "Match the Column" :
                                                                        "Written Answer"}
                                                            </span>
                                                        </div>
                                                        <p className="font-bold text-gray-900 mb-3 text-base">{q.question}</p>

                                                        {/* Show options for MULTIPLE_CHOICE */}
                                                        {q.questionType === "MULTIPLE_CHOICE" && q.options?.length > 0 && (
                                                            <div className="space-y-1.5 mb-3">
                                                                {q.options.map((opt, oIdx) => (
                                                                    <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${oIdx === q.correctAnswer
                                                                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                                                                        : "bg-white/5 border border-white/5 text-gray-500"
                                                                        }`}>
                                                                        <span className="font-bold w-5">{String.fromCharCode(65 + oIdx)}.</span>
                                                                        <span className="flex-1">{opt}</span>
                                                                        {oIdx === q.correctAnswer && (
                                                                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                                                        )}
                                                                    </div>
                                                                ))}
                                                                <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ Correct answer: {String.fromCharCode(65 + q.correctAnswer)}</p>
                                                            </div>
                                                        )}

                                                        {/* Show pairs for MATCHING */}
                                                        {q.questionType === "MATCHING" && Array.isArray(q.options) && q.options.length > 0 && (
                                                            <div className="space-y-2">
                                                                <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider px-1">
                                                                    <span>Term</span><span>Definition</span>
                                                                </div>
                                                                {(q.options as any[]).map((pair: any, pIdx: number) => (
                                                                    <div key={pIdx} className="grid grid-cols-2 gap-2">
                                                                        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-lg px-3 py-2 text-sm font-medium">
                                                                            <span className="font-bold text-xs">{String.fromCharCode(65 + pIdx)}.</span>
                                                                            {pair.left}
                                                                        </div>
                                                                        <div className="flex items-center gap-2 bg-teal-500/10 border border-teal-500/20 text-teal-400 rounded-lg px-3 py-2 text-sm">
                                                                            {pair.right}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Show correct answer for FILL_IN_BLANK */}
                                                        {q.questionType === "FILL_IN_BLANK" && q.options?.[0] && (
                                                            <div className="mt-2 text-sm bg-purple-500/10 p-3 rounded-xl border border-purple-500/20 text-purple-400">
                                                                <span className="font-bold">Correct answer: </span> {q.options[0]}
                                                            </div>
                                                        )}

                                                        {q.questionType === "WRITING" && q.explanation && (
                                                            <div className="mt-3 text-sm bg-emerald-500/10 p-4 rounded-xl border border-emerald-500/20 text-gray-700 leading-relaxed">
                                                                <span className="font-bold text-emerald-600 block mb-1">Model Answer / Rubric:</span> {q.explanation}
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>

                                            {/* View submissions */}
                                            <div className="border-t border-white/10 pt-6">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => loadSubmissions(exercise.id)}
                                                    className="bg-white/5 text-gray-500 border-white/10 hover:bg-white/10 hover:text-gray-900 rounded-xl font-bold flex items-center gap-2"
                                                >
                                                    <Users className="w-4 h-4" />
                                                    {showSubmissions === exercise.id ? "Hide Submissions" : "View Student Submissions"}
                                                </Button>

                                                {showSubmissions === exercise.id && (
                                                    <div className="mt-4 space-y-4">
                                                        {submissionsLoading ? (
                                                            <div className="text-sm text-gray-500">Loading submissions...</div>
                                                        ) : submissions.length === 0 ? (
                                                            <div className="text-sm text-gray-500 py-4 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                                                                No submissions yet.
                                                            </div>
                                                        ) : (
                                                            submissions.map((sub: any) => (
                                                                <div key={sub.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center text-xs font-bold">
                                                                                {sub.student.name?.charAt(0) || "?"}
                                                                            </div>
                                                                            <div>
                                                                                <p className="text-sm font-bold text-gray-900">{sub.student.name}</p>
                                                                                <p className="text-[10px] text-gray-500">{new Date(sub.submittedAt).toLocaleDateString()} · {sub.status === "GRADED" ? "Graded" : "Pending"}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-2">
                                                                            {sub.status === "GRADED" && (
                                                                                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                                                                                    {sub.totalScore}/{sub.totalPossible * 10}
                                                                                </span>
                                                                            )}
                                                                            {sub.status === "SUBMITTED" && (
                                                                                <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold px-4 rounded-xl shadow-sm border border-emerald-400/30 text-xs"
                                                                                    onClick={() => handleGrade(sub.id)}>
                                                                                    <CheckCircle className="w-3.5 h-3.5 mr-1" /> Grade
                                                                                </Button>
                                                                            )}
                                                                        </div>
                                                                    </div>

                                                                    {/* Student answers */}
                                                                    <div className="space-y-3 pl-11">
                                                                        {(sub.answers as Array<{ questionIndex: number; answer: string }>).map((ans: any) => {
                                                                            const question = exercise.questions[ans.questionIndex]
                                                                            const scoreData = gradingData[sub.id]?.scores?.find((s: any) => s.questionIndex === ans.questionIndex)
                                                                            return (
                                                                                <div key={ans.questionIndex} className="bg-white/5 rounded-xl p-4 border border-white/5">
                                                                                    <div className="flex items-center gap-2 mb-2">
                                                                                        <span className="text-xs font-bold text-emerald-400">Q{ans.questionIndex + 1}:</span>
                                                                                        {question?.questionType && (
                                                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                                                                                                question.questionType === "MULTIPLE_CHOICE" ? "bg-blue-500/10 text-blue-400" :
                                                                                                question.questionType === "FILL_IN_BLANK" ? "bg-purple-500/10 text-purple-400" :
                                                                                                question.questionType === "MATCHING" ? "bg-orange-500/10 text-orange-400" :
                                                                                                "bg-emerald-500/10 text-emerald-400"
                                                                                            }`}>
                                                                                                {question.questionType === "MULTIPLE_CHOICE" ? "MC" :
                                                                                                    question.questionType === "FILL_IN_BLANK" ? "FIB" :
                                                                                                    question.questionType === "MATCHING" ? "MATCH" : "WR"}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                    <p className="text-xs text-gray-500 mb-2">{question?.question}</p>
                                                                                    {question?.questionType === "MULTIPLE_CHOICE" && question?.options?.length > 0 ? (
                                                                                        <div className="mb-3 space-y-1">
                                                                                            {question.options.map((opt: string, oIdx: number) => {
                                                                                                const isSelected = String(oIdx) === ans.answer
                                                                                                const isCorrect = oIdx === question.correctAnswer
                                                                                                return (
                                                                                                    <div key={oIdx} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${isSelected && isCorrect
                                                                                                        ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                                                                                        : isSelected && !isCorrect
                                                                                                            ? "bg-rose-500/10 border border-rose-500/30 text-rose-400"
                                                                                                            : isCorrect && !isSelected
                                                                                                                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400/70"
                                                                                                                : "bg-white/5 border border-white/5 text-gray-500"
                                                                                                        }`}>
                                                                                                        <span className="font-bold w-5 shrink-0">{String.fromCharCode(65 + oIdx)}.</span>
                                                                                                        <span className="flex-1">{opt}</span>
                                                                                                        {isSelected && <span className="text-[9px] font-bold uppercase tracking-wider">Selected</span>}
                                                                                                        {isCorrect && !isSelected && <CheckCircle className="w-3 h-3 text-emerald-400/60" />}
                                                                                                    </div>
                                                                                                )
                                                                                            })}
                                                                                        </div>
                                                                                    ) : question?.questionType === "MATCHING" ? (() => {
                                                                                        let matched: Record<number, number> = {}
                                                                                        try { matched = JSON.parse(ans.answer || "{}") } catch { /* empty */ }
                                                                                        return (
                                                                                            <div className="mb-3 space-y-1">
                                                                                                {(question.options as any[]).map((pair: any, pIdx: number) => {
                                                                                                    const chosenIdx = matched[pIdx] ?? null
                                                                                                    const chosenRight = chosenIdx !== null ? (question.options as any[])[chosenIdx]?.right : null
                                                                                                    const isCorrect = chosenIdx === pIdx
                                                                                                    return (
                                                                                                        <div key={pIdx} className={`flex items-center gap-2 p-2 rounded-lg text-xs ${isCorrect ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border border-rose-500/20 text-rose-400"}`}>
                                                                                                            <span className="font-bold shrink-0">{pair.left}</span>
                                                                                                            <span className="text-gray-400">→</span>
                                                                                                            <span>{chosenRight ?? <em className="text-gray-500">not answered</em>}</span>
                                                                                                            {!isCorrect && <span className="ml-auto text-[9px]">✓ {pair.right}</span>}
                                                                                                        </div>
                                                                                                    )
                                                                                                })}
                                                                                            </div>
                                                                                        )
                                                                                    })() : (
                                                                                        <p className="text-sm text-gray-700 bg-white/5 rounded-lg p-3 border border-white/5 mb-3 whitespace-pre-wrap">{ans.answer}</p>
                                                                                    )}
                                                                                    {question?.explanation && (
                                                                                        <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2 mb-3">
                                                                                            <span className="font-bold">Model answer: </span>{question.explanation}
                                                                                        </div>
                                                                                    )}
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="flex items-center gap-1.5">
                                                                                            <label className="text-xs text-gray-500">Score:</label>
                                                                                            <Input
                                                                                                type="number"
                                                                                                min={0}
                                                                                                max={10}
                                                                                                className="w-16 h-8 bg-white/5 border-white/10 text-gray-900 text-xs rounded-lg"
                                                                                                value={scoreData?.score || 0}
                                                                                                onChange={(e) => updateScore(sub.id, ans.questionIndex, Number(e.target.value))}
                                                                                            />
                                                                                            <span className="text-xs text-gray-500">/10</span>
                                                                                        </div>
                                                                                        <Input
                                                                                            className="flex-1 h-8 bg-white/5 border-white/10 text-gray-900 text-xs rounded-lg placeholder:text-gray-500"
                                                                                            placeholder="Feedback comment..."
                                                                                            value={scoreData?.feedback || ""}
                                                                                            onChange={(e) => updateFeedback(sub.id, ans.questionIndex, e.target.value)}
                                                                                        />
                                                                                    </div>
                                                                                </div>
                                                                            )
                                                                        })}
                                                                    </div>

                                                                    {sub.status === "SUBMITTED" && (
                                                                        <div className="flex justify-end pt-2">
                                                                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-gray-900 font-bold px-6 rounded-xl shadow-sm border border-emerald-400/30"
                                                                                onClick={() => handleGrade(sub.id)}>
                                                                                <CheckCircle className="w-4 h-4 mr-1.5" /> Submit Grade
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </>
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

export default function TeacherExercisesPage() {
    return (
        <Suspense fallback={
            <div className="space-y-4 animate-in fade-in duration-700">
                {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white/5 border border-white/10 animate-pulse rounded-2xl" />)}
            </div>
        }>
            <ExercisesContent />
        </Suspense>
    )
}