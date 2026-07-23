"use client"

import React, { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useToast } from "@/components/providers/ToastProvider"
import {
    FileText, ArrowLeft, Send, CheckCircle2,
    Loader2, Award, ListOrdered, Type, AlignLeft, ChevronRight, ArrowLeftRight
} from "lucide-react"
import Link from "next/link"

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false })

type Question = {
    id: string
    question: string
    options: any[]
    correctAnswer: number
    explanation: string | null
    order: number
    questionType: "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "WRITING" | "MATCHING"
}

type ExerciseData = {
    exercise: {
        id: string
        title: string
        description: string | null
        questions: Question[]
        lesson?: { title: string; id: string } | null
        module?: { title: string } | null
    }
    submission: {
        id: string
        answers: { questionIndex: number; answer: string }[]
        scores: { questionIndex: number; score: number; feedback: string }[] | null
        totalScore: number | null
        totalPossible: number
        status: "SUBMITTED" | "GRADED"
        submittedAt: string
        gradedAt: string | null
    } | null
}

const questionTypeIcons: Record<string, React.ReactNode> = {
    MULTIPLE_CHOICE: <ListOrdered className="w-3 h-3" />,
    FILL_IN_BLANK: <Type className="w-3 h-3" />,
    WRITING: <AlignLeft className="w-3 h-3" />,
    MATCHING: <ArrowLeftRight className="w-3 h-3" />,
}

const questionTypeLabels: Record<string, string> = {
    MULTIPLE_CHOICE: "Multiple Choice",
    FILL_IN_BLANK: "Fill in the Blank",
    WRITING: "Written Answer",
    MATCHING: "Match the Column",
}

// Chip colours for matching answers
const CHIP_COLORS = [
    "bg-blue-500 text-white",
    "bg-emerald-500 text-white",
    "bg-violet-500 text-white",
    "bg-orange-500 text-white",
    "bg-rose-500 text-white",
    "bg-teal-500 text-white",
]

function MatchingQuestion({
    pairs, answer, onChange, disabled, scoreData
}: {
    pairs: { left: string; right: string }[]
    answer: string
    onChange: (val: string) => void
    disabled: boolean
    scoreData?: { score: number; feedback: string }
}) {
    // answer is JSON: { [leftIndex]: rightIndex }
    const parsed: Record<number, number> = (() => {
        try { return answer ? JSON.parse(answer) : {} } catch { return {} }
    })()

    const [selected, setSelected] = React.useState<number | null>(null)

    const shuffledRights = React.useMemo(() => {
        return pairs.map((p, i) => ({ text: p.right, origIdx: i }))
            .sort((a, b) => {
                // stable shuffle seeded by content
                const h = (s: string) => s.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
                return h(a.text) % 7 - h(b.text) % 7
            })
    }, [pairs])

    const assignedRight = new Set(Object.values(parsed))

    const handleChipClick = (origIdx: number) => {
        if (disabled) return
        setSelected(s => s === origIdx ? null : origIdx)
    }

    const handleRowClick = (leftIdx: number) => {
        if (disabled || selected === null) return
        const next = { ...parsed }
        // unassign if this chip was already placed somewhere
        for (const k of Object.keys(next)) {
            if (next[Number(k)] === selected) delete next[Number(k)]
        }
        next[leftIdx] = selected
        onChange(JSON.stringify(next))
        setSelected(null)
    }

    const clearRow = (leftIdx: number) => {
        if (disabled) return
        const next = { ...parsed }
        delete next[leftIdx]
        onChange(JSON.stringify(next))
    }

    return (
        <div className="space-y-4">
            {/* Answer chips */}
            {!disabled && (
                <div>
                    <p className="text-xs font-semibold text-gray-500 mb-2">Click an answer, then click a row to match it:</p>
                    <div className="flex flex-wrap gap-2">
                        {shuffledRights.map((item) => {
                            const isAssigned = assignedRight.has(item.origIdx)
                            const isSelected = selected === item.origIdx
                            const color = CHIP_COLORS[item.origIdx % CHIP_COLORS.length]
                            return (
                                <button
                                    key={item.origIdx}
                                    type="button"
                                    onClick={() => handleChipClick(item.origIdx)}
                                    disabled={isAssigned}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border-2 ${isSelected ? `${color} border-white scale-105 shadow-lg` :
                                        isAssigned ? "bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-50" :
                                            `${color} border-transparent hover:scale-105 hover:shadow-md`
                                        }`}
                                >
                                    {item.text}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Term rows */}
            <div className="space-y-2">
                {pairs.map((pair, leftIdx) => {
                    const assignedOrigIdx = parsed[leftIdx] ?? null
                    const assignedItem = assignedOrigIdx !== null ? shuffledRights.find(r => r.origIdx === assignedOrigIdx) : null
                    const color = assignedOrigIdx !== null ? CHIP_COLORS[assignedOrigIdx % CHIP_COLORS.length] : ""
                    const isCorrect = scoreData && assignedOrigIdx === leftIdx
                    return (
                        <div
                            key={leftIdx}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${!disabled && selected !== null ? "cursor-pointer hover:border-emerald-400 hover:bg-emerald-50" : ""
                                } ${scoreData ? (isCorrect ? "border-emerald-300 bg-emerald-50" : "border-rose-300 bg-rose-50") : "border-gray-200 bg-white"
                                }`}
                            onClick={() => handleRowClick(leftIdx)}
                        >
                            <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center text-xs font-bold shrink-0">
                                {leftIdx + 1}
                            </span>
                            <span className="flex-1 text-sm font-semibold text-gray-800">{pair.left}</span>
                            <div className="min-w-[120px] flex items-center justify-between gap-2">
                                {assignedItem ? (
                                    <span className={`px-3 py-1 rounded-lg text-sm font-semibold ${color}`}>
                                        {assignedItem.text}
                                    </span>
                                ) : (
                                    <span className="px-3 py-1 rounded-lg text-sm text-gray-400 border-2 border-dashed border-gray-300 min-w-[80px]">
                                        &nbsp;
                                    </span>
                                )}
                                {assignedItem && !disabled && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); clearRow(leftIdx) }}
                                        className="text-gray-400 hover:text-rose-500 text-xs font-bold">
                                        ✕
                                    </button>
                                )}
                                {scoreData && (
                                    <span className={`text-xs font-bold ${isCorrect ? "text-emerald-600" : "text-rose-500"}`}>
                                        {isCorrect ? "✓" : `✗ → ${pairs[leftIdx]?.right}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function StudentExercisePage() {
    const params = useParams()
    const router = useRouter()
    const { data: session } = useSession()
    const { showToast } = useToast()

    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ExerciseData | null>(null)
    const [answers, setAnswers] = useState<Record<number, string>>({})
    const [submitting, setSubmitting] = useState(false)
    const [hasSubmitted, setHasSubmitted] = useState(false)
    const [nextAction, setNextAction] = useState<{ type: string; url: string; label: string; message: string } | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/exercises/student?exerciseId=${params.id}`)
                if (!res.ok) {
                    if (res.status === 404) {
                        showToast("Exercise not found.")
                        router.push("/dashboard")
                        return
                    }
                    throw new Error("Failed to load")
                }
                const exerciseData: ExerciseData = await res.json()
                setData(exerciseData)

                if (exerciseData.submission) {
                    setHasSubmitted(true)
                    // Pre-fill answers from existing submission
                    const existingAnswers: Record<number, string> = {}
                    exerciseData.submission.answers.forEach((a) => {
                        existingAnswers[a.questionIndex] = a.answer
                    })
                    setAnswers(existingAnswers)
                }
            } catch {
                showToast("Failed to load exercise.")
                router.push("/dashboard")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [params.id, router, showToast])

    const handleSubmit = async () => {
        // Validate all questions answered
        const unanswered: number[] = []
        data?.exercise.questions.forEach((q) => {
            if (q.questionType === "MATCHING") {
                try {
                    const parsed = JSON.parse(answers[q.order] || "{}")
                    const pairCount = (q.options as any[]).length
                    if (Object.keys(parsed).length < pairCount) unanswered.push(q.order + 1)
                } catch { unanswered.push(q.order + 1) }
            } else if (!answers[q.order]?.trim()) {
                unanswered.push(q.order + 1)
            }
        })

        if (unanswered.length > 0) {
            showToast(`Please answer all questions before submitting. Unanswered: Q${unanswered.join(", Q")}`)
            return
        }

        setSubmitting(true)
        try {
            const formattedAnswers = Object.entries(answers).map(([qIdx, answer]) => ({
                questionIndex: parseInt(qIdx),
                answer,
            }))

            const res = await fetch("/api/exercises/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ exerciseId: params.id, answers: formattedAnswers }),
            })

            if (res.ok) {
                setHasSubmitted(true)
                const result = await res.json()
                // Update the local data with the auto-graded submission so the
                // grade banner and per-question scores/feedback render
                // immediately without a page reload.
                if (result.submission && data) {
                    setData({
                        ...data,
                        submission: {
                            id: result.submission.id,
                            answers: result.submission.answers,
                            scores: result.submission.scores,
                            totalScore: result.submission.totalScore,
                            totalPossible: result.submission.totalPossible,
                            status: result.submission.status,
                            submittedAt: result.submission.submittedAt,
                            gradedAt: result.submission.gradedAt,
                        },
                    })
                }
                if (result.nextAction) {
                    setNextAction(result.nextAction)
                    showToast(result.nextAction.message || "Exercise submitted and auto-graded!", "success")
                } else {
                    showToast("Exercise submitted and auto-graded! Check your scores below.", "success")
                }
            } else {
                const err = await res.json()
                showToast(err.error || "Failed to submit exercise.")
            }
        } catch {
            showToast("Error submitting exercise. Please try again.")
        } finally {
            setSubmitting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-6 h-6 text-indigo-500 animate-spin" />
            </div>
        )
    }

    if (!data) return null

    const { exercise, submission } = data
    const isGraded = submission?.status === "GRADED"

    return (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Back button */}
            {exercise.lesson && (
                <Link
                    href={`/dashboard/lessons/${exercise.lesson.id}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back to Lesson
                </Link>
            )}

            {/* Header */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 border border-emerald-200 rounded-xl flex items-center justify-center shrink-0">
                        <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h1 className="text-lg font-black text-gray-900">{exercise.title}</h1>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-md uppercase font-bold tracking-wider">
                                Exercise
                            </span>
                        </div>
                        {exercise.description && (
                            <p className="text-sm text-gray-500">{exercise.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">{exercise.questions.length} prompts</p>
                    </div>
                    {hasSubmitted && (
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1.5 shrink-0">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            {isGraded ? "Graded" : "Submitted"}
                        </div>
                    )}
                </div>
            </div>

            {/* Graded result banner */}
            {isGraded && submission && (
                <Card className="p-5 bg-gradient-to-r from-emerald-50 to-white border-emerald-200 rounded-xl">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                            <Award className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-gray-900">Grade: {submission.totalScore}/{submission.totalPossible * 10}</h3>
                            <p className="text-sm text-gray-500">
                                Graded on {new Date(submission.gradedAt!).toLocaleDateString(undefined, { dateStyle: "medium" })}
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Questions */}
            <div className="space-y-5">
                {exercise.questions.map((q, idx) => {
                    const scoreData = submission?.scores?.find((s) => s.questionIndex === q.order)
                    return (
                        <Card key={q.id} className={`p-5 rounded-xl border ${scoreData ? "border-emerald-200" : "border-gray-200"}`}>
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 uppercase tracking-wider">
                                    Question {idx + 1}
                                </span>
                                <span className={`text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1 ${q.questionType === "MULTIPLE_CHOICE" ? "bg-blue-50 text-blue-600 border border-blue-200" :
                                    q.questionType === "FILL_IN_BLANK" ? "bg-purple-50 text-purple-600 border border-purple-200" :
                                        q.questionType === "MATCHING" ? "bg-orange-50 text-orange-600 border border-orange-200" :
                                            "bg-emerald-50 text-emerald-600 border border-emerald-200"
                                    }`}>
                                    {questionTypeIcons[q.questionType] || null}
                                    {questionTypeLabels[q.questionType] || "Question"}
                                </span>
                            </div>
                            <p className="text-sm font-semibold text-gray-900 mb-3 leading-relaxed">{q.question}</p>

                            {/* MULTIPLE CHOICE - radio buttons */}
                            {q.questionType === "MULTIPLE_CHOICE" && q.options?.length > 0 && (
                                <div className="space-y-2">
                                    {q.options.map((opt, oIdx) => (
                                        <label
                                            key={oIdx}
                                            className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${hasSubmitted
                                                ? answers[q.order] === String(oIdx)
                                                    ? "border-emerald-300 bg-emerald-50"
                                                    : "border-gray-200 bg-gray-50 cursor-not-allowed"
                                                : answers[q.order] === String(oIdx)
                                                    ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                                                    : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50"
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name={`question-${q.order}`}
                                                value={String(oIdx)}
                                                checked={answers[q.order] === String(oIdx)}
                                                onChange={() => setAnswers((prev) => ({ ...prev, [q.order]: String(oIdx) }))}
                                                disabled={hasSubmitted}
                                                className="accent-emerald-600"
                                            />
                                            <div className="flex-1">
                                                <span className="text-sm font-medium text-gray-700">
                                                    <span className="font-bold text-gray-500 mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                                    {opt}
                                                </span>
                                            </div>
                                            {scoreData && q.options.indexOf(opt) === q.correctAnswer && (
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            )}
                                        </label>
                                    ))}
                                    {q.options[0] && scoreData && (
                                        <p className="text-xs text-emerald-600 font-medium mt-1">
                                            ✓ Correct answer: {String.fromCharCode(65 + q.correctAnswer)}.
                                            {q.options[q.correctAnswer] && ` ${q.options[q.correctAnswer]}`}
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* FILL IN THE BLANK - text input */}
                            {q.questionType === "FILL_IN_BLANK" && (
                                <div>
                                    <input
                                        type="text"
                                        placeholder="Type your answer here..."
                                        value={answers[q.order] || ""}
                                        onChange={(e) => setAnswers((prev) => ({ ...prev, [q.order]: e.target.value }))}
                                        disabled={hasSubmitted}
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    />
                                    {scoreData && q.options?.[0] && (
                                        <div className={`mt-2 p-3 rounded-lg border text-sm ${answers[q.order]?.toLowerCase().trim() === q.options[0].toLowerCase().trim()
                                            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                                            : "bg-amber-50 border-amber-200 text-amber-700"
                                            }`}>
                                            <span className="font-bold">Correct answer: </span>
                                            {q.options[0]}
                                            {answers[q.order]?.toLowerCase().trim() === q.options[0].toLowerCase().trim()
                                                ? " ✓"
                                                : ` (your answer: "${answers[q.order] || "not answered"}")`}
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MATCHING - interactive chips UI */}
                            {q.questionType === "MATCHING" && Array.isArray(q.options) && q.options.length > 0 && (
                                <MatchingQuestion
                                    pairs={q.options as { left: string; right: string }[]}
                                    answer={answers[q.order] || ""}
                                    onChange={(val) => setAnswers((prev) => ({ ...prev, [q.order]: val }))}
                                    disabled={hasSubmitted}
                                    scoreData={scoreData ?? undefined}
                                />
                            )}

                            {/* WRITING - rich text editor */}
                            {q.questionType === "WRITING" && (
                                <div className="writing-answer-editor rounded-xl border border-gray-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:border-emerald-500 transition-all disabled:opacity-60">
                                    <ReactQuill
                                        theme="snow"
                                        placeholder="Write your answer here..."
                                        value={answers[q.order] || ""}
                                        onChange={(value) => setAnswers((prev) => ({ ...prev, [q.order]: value }))}
                                        readOnly={hasSubmitted}
                                        modules={{
                                            toolbar: hasSubmitted ? false : [
                                                [{ header: [1, 2, 3, false] }],
                                                ["bold", "italic", "underline", "strike"],
                                                [{ list: "ordered" }, { list: "bullet" }],
                                                ["link", "blockquote"],
                                                ["clean"],
                                            ],
                                        }}
                                    />
                                </div>
                            )}

                            {/* Grade feedback */}
                            {scoreData && (
                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-bold text-gray-500">Score:</span>
                                        <span className="text-sm font-black text-emerald-600">
                                            {scoreData.score}/10
                                        </span>
                                    </div>
                                    {scoreData.feedback && (
                                        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 leading-relaxed">
                                            <span className="font-bold text-gray-900 block mb-0.5">Feedback:</span>
                                            {scoreData.feedback}
                                        </div>
                                    )}
                                </div>
                            )}
                        </Card>
                    )
                })}
            </div>

            {/* Submit / Already submitted */}
            <div className="flex justify-end pt-2">
                {!hasSubmitted ? (
                    <Button
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="bg-gradient-to-r from-blue-600 to-violet-600 border-0 text-white rounded-xl shadow-sm transition-all duration-300"
                    >
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                            </>
                        ) : (
                            <>
                                <Send className="w-4 h-4 mr-2" /> Submit Exercise
                            </>
                        )}
                    </Button>
                ) : (
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                        <div className="flex items-center gap-2 text-sm text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-xl px-5 py-3 font-semibold">
                            <CheckCircle2 className="w-4 h-4" />
                            {isGraded
                                ? "Your exercise has been auto-graded. Check your scores and feedback above!"
                                : "Exercise submitted. Awaiting teacher review."}
                        </div>
                        {nextAction && (
                            <Button
                                onClick={() => router.push(nextAction.url)}
                                className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-sm transition-all duration-300 flex items-center gap-2"
                            >
                                {nextAction.label || "Proceed"}
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}