"use client"

import Link from "next/link"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { ArrowLeft, CheckCircle2, Clock, GraduationCap, Loader2, Mic, MicOff, Pause, Play, RefreshCcw, Target, Volume2, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

type AutoScore = {
    questionIndex: number
    score: number
    feedback: string
    criteria: {
        length: number
        lengthScore: number
        structureScore: number
        vocabularyScore: number
        accuracyScore: number
        modelScore: number
    }
}

type SubmissionData = {
    autoScores: AutoScore[] | null
    totalScore: number | null
    totalPossible: number
}

type QuestionType = "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "WRITING" | "SPEAKING"

type ExamQuizQuestion = {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation: string | null
    questionType: QuestionType
    audioUrl: string | null
    passage: string | null
    wordLimit: string | null
}

type ExamQuiz = {
    id: string
    title: string
    description: string | null
    exam: string | null
    section: string | null
    level: string | null
    timeLimit: number | null
    passMark: number
    questions: ExamQuizQuestion[]
}

const examDescriptions: Record<string, string> = {
    TCF: "Prepare for TCF Canada, TCF Quebec, and general TCF skills with teacher-created MCQ tests.",
    TEF: "Practice TEF Canada and TEF Quebec readiness with focused comprehension, grammar, and expression MCQs.",
}

function normalizeOptions(options: unknown): string[] {
    return Array.isArray(options) ? options.map((value) => String(value)) : []
}

// ─── Speaking Question Component ────────────────────────────────────────────
type SpeakingQuestionProps = {
    audioUrl: string | null
    transcription: string
    onTranscription: (text: string) => void
    disabled: boolean
}

function SpeakingQuestion({ audioUrl, transcription, onTranscription, disabled }: SpeakingQuestionProps) {
    const [playing, setPlaying] = useState(false)
    const [recording, setRecording] = useState(false)
    const [hasSpeechAPI, setHasSpeechAPI] = useState(false)
    const [listenedOnce, setListenedOnce] = useState(false)
    const [recStatus, setRecStatus] = useState<"idle" | "recording" | "processing" | "done">("idle")

    const audioRef = useRef<HTMLAudioElement | null>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognitionRef = useRef<any>(null)

    useEffect(() => {
        // Check Web Speech API availability
        const SpeechRecognition =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        setHasSpeechAPI(!!SpeechRecognition)
    }, [])

    // Audio playback
    const togglePlay = useCallback(() => {
        if (!audioUrl) return
        if (!audioRef.current) {
            audioRef.current = new Audio(audioUrl)
            audioRef.current.onended = () => { setPlaying(false); setListenedOnce(true) }
        }
        if (playing) {
            audioRef.current.pause()
            setPlaying(false)
        } else {
            audioRef.current.play()
            setPlaying(true)
        }
    }, [audioUrl, playing])

    // Record + transcribe
    const startRecording = useCallback(async () => {
        setRecStatus("recording")
        setRecording(true)
        try {
            // Use Web Speech API for live transcription if available
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
            if (SpeechRecognition) {
                const recognition = new SpeechRecognition()
                recognition.lang = "fr-FR"
                recognition.continuous = true
                recognition.interimResults = true
                let finalTranscript = ""
                recognition.onresult = (event: { results: SpeechRecognitionResultList }) => {
                    finalTranscript = ""
                    for (let i = 0; i < event.results.length; i++) {
                        finalTranscript += event.results[i][0].transcript
                    }
                    onTranscription(finalTranscript)
                }
                recognition.onerror = () => { setRecStatus("idle"); setRecording(false) }
                recognition.onend = () => { setRecStatus("done"); setRecording(false) }
                recognitionRef.current = recognition
                recognition.start()
            } else {
                // Fallback: just record audio blob (transcription skipped)
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
                const mr = new MediaRecorder(stream)
                chunksRef.current = []
                mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
                mr.onstop = () => { stream.getTracks().forEach(t => t.stop()); setRecStatus("done"); setRecording(false) }
                mr.start()
                mediaRecorderRef.current = mr
            }
        } catch {
            setRecStatus("idle")
            setRecording(false)
        }
    }, [onTranscription])

    const stopRecording = useCallback(() => {
        if (recognitionRef.current) {
            recognitionRef.current.stop()
            recognitionRef.current = null
        } else {
            mediaRecorderRef.current?.stop()
        }
        setRecording(false)
        setRecStatus("done")
    }, [])

    return (
        <div className="space-y-4">
            {/* Teacher audio prompt */}
            {audioUrl && (
                <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="w-7 h-7 bg-violet-600 rounded-lg flex items-center justify-center">
                            <Volume2 className="w-3.5 h-3.5 text-white" />
                        </div>
                        <p className="text-xs font-bold text-violet-900">🎤 Teacher Audio Prompt</p>
                        <p className="text-[10px] text-violet-500 ml-auto">Listen carefully before recording your answer</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={togglePlay}
                            disabled={disabled}
                            className="flex items-center gap-2 px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors shadow-sm"
                        >
                            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                            {playing ? "Pause" : listenedOnce ? "Play Again" : "Play Prompt"}
                        </button>
                        {listenedOnce && (
                            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Listened
                            </span>
                        )}
                    </div>
                </div>
            )}

            {/* Student voice recorder */}
            <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
                        <Mic className="w-3.5 h-3.5 text-white" />
                    </div>
                    <p className="text-xs font-bold text-indigo-900">Your Voice Answer</p>
                    {hasSpeechAPI && <span className="text-[10px] text-indigo-500 ml-auto">Speech → Text auto-transcription active</span>}
                </div>

                {transcription && (
                    <div className="bg-white rounded-xl border border-indigo-200 px-3 py-2.5">
                        <p className="text-[10px] font-bold text-indigo-600 mb-1">Transcribed:</p>
                        <p className="text-sm text-gray-800 leading-relaxed">{transcription}</p>
                    </div>
                )}

                <div className="flex gap-2">
                    {!recording ? (
                        <button
                            onClick={startRecording}
                            disabled={disabled}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
                        >
                            <Mic className="w-3.5 h-3.5" />
                            {recStatus === "done" ? "Record Again" : "Record Answer"}
                        </button>
                    ) : (
                        <button
                            onClick={stopRecording}
                            className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm animate-pulse"
                        >
                            <MicOff className="w-3.5 h-3.5" />
                            Stop Recording
                        </button>
                    )}
                    {recStatus === "processing" && <Loader2 className="w-4 h-4 text-indigo-500 animate-spin my-auto" />}
                </div>

                {recording && (
                    <div className="flex items-center gap-2 text-rose-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                        <span className="text-[11px] font-bold">
                            {hasSpeechAPI ? "Recording & transcribing… speak in French" : "Recording… click Stop when done"}
                        </span>
                    </div>
                )}

                {!hasSpeechAPI && recStatus !== "done" && (
                    <p className="text-[10px] text-indigo-500">
                        Speech recognition not available in this browser. You can type your answer below instead.
                    </p>
                )}
            </div>

            {/* Text fallback */}
            <div>
                <label className="block text-[11px] font-semibold text-gray-500 mb-1.5">
                    {hasSpeechAPI ? "Edit transcription if needed:" : "Type your answer (if microphone unavailable):"}
                </label>
                <textarea
                    value={transcription}
                    onChange={(e) => !disabled && onTranscription(e.target.value)}
                    placeholder="Your spoken or typed response will appear here..."
                    className="w-full min-h-24 rounded-xl border-2 border-gray-200 p-3 text-sm text-gray-900 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/10"
                />
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
export default function ExamPrepPage() {
    const [quizzes, setQuizzes] = useState<ExamQuiz[]>([])
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState<string | null>(null)
    const [selectedExam, setSelectedExam] = useState("TCF")
    const [selectedTestId, setSelectedTestId] = useState<string>("")
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0)
    const [answers, setAnswers] = useState<(number | string)[]>([])
    const [submitted, setSubmitted] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [submissionData, setSubmissionData] = useState<SubmissionData | null>(null)
    const [submissionError, setSubmissionError] = useState<string | null>(null)

    useEffect(() => {
        let active = true

        async function loadQuizzes() {
            try {
                const res = await fetch("/api/exam-prep")
                const data = await res.json()

                if (!active) return

                const normalized = Array.isArray(data)
                    ? data.map((quiz) => ({
                        ...quiz,
                        exam: quiz.exam || null,
                        section: quiz.section || null,
                        level: quiz.level || null,
                        questions: Array.isArray(quiz.questions)
                            ? quiz.questions.map((question: ExamQuizQuestion) => ({
                                ...question,
                                questionType: question.questionType || "MULTIPLE_CHOICE",
                                options: normalizeOptions(question.options),
                            }))
                            : [],
                    }))
                    : []

                setQuizzes(normalized)
                setFetchError(null)
            } catch {
                if (!active) return
                setQuizzes([])
                setFetchError("Failed to load exam prep quizzes.")
            } finally {
                if (active) setLoading(false)
            }
        }

        loadQuizzes()

        return () => {
            active = false
        }
    }, [])

    const availableExams = useMemo(() => {
        const examSet = new Set<string>()
        quizzes.forEach((quiz) => {
            if (quiz.exam) examSet.add(quiz.exam)
        })

        if (examSet.size === 0) {
            return ["TCF", "TEF"]
        }

        return Array.from(examSet)
    }, [quizzes])

    const selectedExamQuizzes = useMemo(
        () => quizzes.filter((quiz) => (quiz.exam || "TCF") === selectedExam),
        [quizzes, selectedExam]
    )

    const selectedTest = useMemo(
        () => selectedExamQuizzes.find((quiz) => quiz.id === selectedTestId) ?? selectedExamQuizzes[0] ?? null,
        [selectedExamQuizzes, selectedTestId]
    )

    // Canonical TCF section order
    const SECTION_ORDER = [
        "Compréhension Orale",
        "Compréhension Écrite",
        "Lexique et Structure",
        "Expression Écrite",
        "Expression Orale",
    ]

    const SECTION_META: Record<string, { icon: string; color: string; bg: string; border: string; badge: string }> = {
        "Compréhension Orale":   { icon: "🎧", color: "text-indigo-700",  bg: "bg-indigo-50",  border: "border-indigo-200", badge: "bg-indigo-100 text-indigo-700" },
        "Compréhension Écrite":  { icon: "📖", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" },
        "Lexique et Structure":  { icon: "📝", color: "text-amber-700",   bg: "bg-amber-50",   border: "border-amber-200",   badge: "bg-amber-100 text-amber-700" },
        "Expression Écrite":     { icon: "✍️", color: "text-violet-700",  bg: "bg-violet-50",  border: "border-violet-200",  badge: "bg-violet-100 text-violet-700" },
        "Expression Orale":      { icon: "🎤", color: "text-rose-700",    bg: "bg-rose-50",    border: "border-rose-200",    badge: "bg-rose-100 text-rose-700" },
    }

    // Group quizzes by section and sort within canonical order
    const groupedBySection = useMemo(() => {
        const map = new Map<string, ExamQuiz[]>()
        selectedExamQuizzes.forEach((quiz) => {
            const sec = quiz.section || "Other"
            if (!map.has(sec)) map.set(sec, [])
            map.get(sec)!.push(quiz)
        })
        // Sort sections by canonical order; unknowns go last
        const ordered: Array<{ section: string; quizzes: ExamQuiz[] }> = []
        SECTION_ORDER.forEach((sec) => {
            if (map.has(sec)) ordered.push({ section: sec, quizzes: map.get(sec)! })
        })
        // Append any sections not in canonical list
        map.forEach((qs, sec) => {
            if (!SECTION_ORDER.includes(sec)) ordered.push({ section: sec, quizzes: qs })
        })
        return ordered
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedExamQuizzes])

    useEffect(() => {
        if (availableExams.length === 0) return

        if (!availableExams.includes(selectedExam)) {
            setSelectedExam(availableExams[0])
            return
        }

        if (selectedExamQuizzes.length > 0 && !selectedExamQuizzes.some((quiz) => quiz.id === selectedTestId)) {
            setSelectedTestId(selectedExamQuizzes[0].id)
            setCurrentQuestionIdx(0)
            setAnswers([])
            setSubmitted(false)
        }
    }, [availableExams, selectedExam, selectedExamQuizzes, selectedTestId])

    useEffect(() => {
        if (!selectedTest && selectedExamQuizzes.length > 0) {
            setSelectedTestId(selectedExamQuizzes[0].id)
            setCurrentQuestionIdx(0)
            setAnswers([])
            setSubmitted(false)
        }
    }, [selectedExamQuizzes, selectedTest])

    useEffect(() => {
        if (!selectedTest) return
        if (currentQuestionIdx >= selectedTest.questions.length) {
            setCurrentQuestionIdx(0)
        }
    }, [currentQuestionIdx, selectedTest])

    function startTest(test: ExamQuiz) {
        setSelectedExam(test.exam || "TCF")
        setSelectedTestId(test.id)
        setCurrentQuestionIdx(0)
        setAnswers([])
        setSubmitted(false)
        setSubmissionData(null)
        setSubmissionError(null)
    }

    function changeExam(exam: string) {
        setSelectedExam(exam)
        const firstTest = quizzes.find((quiz) => (quiz.exam || "TCF") === exam)
        if (firstTest) {
            startTest(firstTest)
            return
        }

        setSelectedTestId("")
        setCurrentQuestionIdx(0)
        setAnswers([])
        setSubmitted(false)
        setSubmissionData(null)
        setSubmissionError(null)
    }

    function selectAnswer(optionIndex: number) {
        if (submitted || !selectedTest) return
        const nextAnswers = [...answers]
        nextAnswers[currentQuestionIdx] = optionIndex
        setAnswers(nextAnswers)
    }

    function writeAnswer(value: string) {
        if (submitted || !selectedTest) return
        const nextAnswers = [...answers]
        nextAnswers[currentQuestionIdx] = value
        setAnswers(nextAnswers)
    }

    function resetCurrentTest() {
        setCurrentQuestionIdx(0)
        setAnswers([])
        setSubmitted(false)
        setSubmissionData(null)
        setSubmissionError(null)
    }

    // Submit answers for automatic checking. Nothing is stored in the database —
    // the auto-check runs in memory and the scores are returned immediately.
    async function handleSubmitForReview() {
        if (!selectedTest) {
            setSubmitted(true)
            return
        }
        setSubmitting(true)
        setSubmissionError(null)
        try {
            const payload = {
                quizId: selectedTest.id,
                answers: selectedTest.questions.map((question, index) => ({
                    questionIndex: index,
                    answer: typeof answers[index] === "string" ? (answers[index] as string) : String(answers[index] ?? ""),
                })),
            }
            const res = await fetch("/api/exam-prep/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })
            const data = await res.json()
            if (!res.ok) {
                setSubmissionError(data.error || "Failed to submit for auto-check")
                setSubmitted(true)
                return
            }
            setSubmissionData({
                autoScores: data.autoScores,
                totalScore: data.totalScore,
                totalPossible: data.totalPossible,
            })
            setSubmitted(true)
        } catch {
            setSubmissionError("Failed to submit for auto-check")
            setSubmitted(true)
        } finally {
            setSubmitting(false)
        }
    }

    const currentQuestion = selectedTest?.questions[currentQuestionIdx]
    const isCurrentAutoGraded = currentQuestion?.questionType === "MULTIPLE_CHOICE" || currentQuestion?.questionType === "FILL_IN_BLANK"
    const allAnswered = selectedTest ? selectedTest.questions.every((question, index) => {
        const answer = answers[index]
        return question.questionType === "WRITING" || question.questionType === "SPEAKING"
            ? typeof answer === "string" && answer.trim().length > 0
            : answer !== undefined
    }) : false
    const autoGradedQuestions = selectedTest?.questions.filter((question) => question.questionType === "MULTIPLE_CHOICE" || question.questionType === "FILL_IN_BLANK") ?? []
    const correctCount = selectedTest
        ? selectedTest.questions.reduce(
            (total, question, index) => total + (answers[index] === question.correctAnswer ? 1 : 0),
            0
        )
        : 0
    const score = autoGradedQuestions.length > 0
        ? Math.round((correctCount / autoGradedQuestions.length) * 100)
        : 0
    const passed = selectedTest ? score >= selectedTest.passMark : false

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] text-gray-900">
                <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 flex items-center justify-between gap-3">
                        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a237e]">
                            <GraduationCap className="w-5 h-5" /> EasyFrench
                        </Link>
                        <Link href="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#1a237e]">
                            <ArrowLeft className="w-4 h-4" /> Home
                        </Link>
                    </div>
                </header>

                <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14">
                    <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-8">
                        {[].map((item) => (
                            <div key={item} className="h-96 rounded-3xl bg-white border border-gray-200 animate-pulse" />
                        ))}
                    </div>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-gray-900">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-3 flex items-center justify-between gap-3">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#1a237e]">
                        <GraduationCap className="w-5 h-5" /> EasyFrench
                    </Link>
                    <Link href="/" className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-gray-600 hover:text-[#1a237e]">
                        <ArrowLeft className="w-4 h-4" /> Home
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12 py-10 sm:py-14">
                <section className="grid lg:grid-cols-[0.9fr_1.1fr] gap-6 lg:gap-8 items-start">
                    <div className="space-y-5">
                        <div className="rounded-3xl bg-gradient-to-br from-[#1a237e] to-[#2e7d32] p-6 sm:p-8 text-white shadow-xl">
                            <span className="inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4">
                                Teacher-managed exam prep
                            </span>
                            <h1 className="text-3xl sm:text-4xl font-black tracking-tight mb-3">
                                TCF and TEF Exam Preparation
                            </h1>
                            <p className="text-white/85 text-sm sm:text-base leading-relaxed">
                                Practice with teacher-created mock quizzes stored in the backend. Scores, feedback, and answers are loaded directly from the database.
                            </p>
                            <div className="grid grid-cols-3 gap-3 mt-6">
                                {[
                                    { icon: Target, label: "Exam MCQs" },
                                    { icon: Clock, label: "Timed sets" },
                                    { icon: CheckCircle2, label: "Instant score" },
                                ].map(({ icon: Icon, label }) => (
                                    <div key={label} className="rounded-2xl bg-white/10 border border-white/10 p-3 text-center">
                                        <Icon className="w-5 h-5 mx-auto mb-1.5" />
                                        <p className="text-[11px] font-semibold">{label}</p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {fetchError && (
                            <Card className="p-4 sm:p-5 rounded-2xl border-red-200 bg-red-50 text-red-700 font-medium">
                                {fetchError}
                            </Card>
                        )}

                        <Card className="p-4 sm:p-5 rounded-2xl border-gray-200 bg-white">
                            <h2 className="font-bold text-gray-900 mb-3">Choose Exam</h2>
                            <div className="grid grid-cols-2 gap-3">
                                {availableExams.map((exam) => (
                                    <button
                                        key={exam}
                                        onClick={() => changeExam(exam)}
                                        className={`rounded-2xl border-2 p-4 text-left transition-all ${selectedExam === exam
                                            ? "border-[#1a237e] bg-[#e8eaf6] text-[#1a237e]"
                                            : "border-gray-200 hover:border-gray-300 bg-white"
                                            }`}
                                    >
                                        <span className="text-lg font-black block">{exam}</span>
                                        <span className="text-xs text-gray-500 leading-relaxed block mt-1">
                                            {examDescriptions[exam] ?? "Teacher-created exam prep quizzes for this exam."}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </Card>

                        <div className="space-y-2">
                            {selectedExamQuizzes.length === 0 ? (
                                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
                                    No quizzes are available for {selectedExam} yet. Teachers can create them from the teacher dashboard.
                                </div>
                            ) : (
                                groupedBySection.map(({ section, quizzes: sectionQuizzes }, groupIdx) => {
                                    const meta = SECTION_META[section] ?? { icon: "📋", color: "text-gray-700", bg: "bg-gray-50", border: "border-gray-200", badge: "bg-gray-100 text-gray-700" }
                                    const stepNumber = groupIdx + 1
                                    return (
                                        <div key={section} className={`rounded-2xl border ${meta.border} overflow-hidden shadow-sm`}>
                                            {/* Section header */}
                                            <div className={`${meta.bg} px-4 py-3 flex items-center gap-3`}>
                                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white/80 text-xs font-black text-gray-700 shrink-0 shadow-sm">
                                                    {stepNumber}
                                                </div>
                                                <span className="text-base">{meta.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-xs font-black uppercase tracking-wider ${meta.color}`}>{section}</p>
                                                    <p className="text-[10px] text-gray-500 mt-0.5">{sectionQuizzes.length} module{sectionQuizzes.length !== 1 ? "s" : ""}</p>
                                                </div>
                                            </div>
                                            {/* Modules list */}
                                            <div className="bg-white divide-y divide-gray-100">
                                                {sectionQuizzes.map((test) => {
                                                    const isActive = selectedTest?.id === test.id
                                                    return (
                                                        <button
                                                            key={test.id}
                                                            onClick={() => startTest(test)}
                                                            className={`w-full px-4 py-3 text-left transition-all ${isActive ? meta.bg : "hover:bg-gray-50"}`}
                                                        >
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="flex-1 min-w-0">
                                                                    <h3 className={`font-bold text-sm leading-tight ${isActive ? meta.color : "text-gray-800"}`}>
                                                                        {test.title}
                                                                    </h3>
                                                                    {test.description && (
                                                                        <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{test.description}</p>
                                                                    )}
                                                                    <p className="text-[10px] text-gray-400 mt-1.5">
                                                                        {test.questions.length} questions · {test.timeLimit ?? 0} min · Pass {test.passMark}%
                                                                    </p>
                                                                </div>
                                                                <div className="flex flex-col items-end gap-1 shrink-0">
                                                                    {test.level && (
                                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${isActive ? meta.badge : "bg-gray-100 text-gray-600"}`}>
                                                                            {test.level}
                                                                        </span>
                                                                    )}
                                                                    {isActive && (
                                                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-black ${meta.badge}`}>▶ Active</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>

                    </div>

                    <div className="space-y-5">
                        <Card className="p-5 sm:p-7 rounded-3xl border-gray-200 bg-white shadow-sm">
                            {!selectedTest || !currentQuestion ? (
                                <div className="text-center rounded-3xl bg-gray-50 border border-gray-100 p-10">
                                    <h2 className="text-2xl font-black text-gray-900">No quiz selected</h2>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Choose a teacher-created exam prep quiz to start practicing.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 pb-5 mb-5">
                                        <div>
                                            <p className="text-xs font-bold uppercase tracking-wider text-[#2e7d32]">
                                                {selectedTest.exam || "General"} mock test
                                            </p>
                                            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mt-1">{selectedTest.title}</h2>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {[selectedTest.section, selectedTest.level].filter(Boolean).join(" - ") || "Teacher-created backend quiz"}
                                            </p>
                                        </div>
                                        <div className="flex gap-2 text-xs font-semibold text-gray-500">
                                            <span className="rounded-full bg-gray-100 px-3 py-1">
                                                Q {currentQuestionIdx + 1}/{selectedTest.questions.length}
                                            </span>
                                            <span className="rounded-full bg-gray-100 px-3 py-1">
                                                {selectedTest.timeLimit ?? 0} min
                                            </span>
                                        </div>
                                    </div>

                                    {!submitted ? (
                                        <>
                                            <div className="mb-6">
                                                {/* Audio player for listening questions */}
                                                {currentQuestion.audioUrl && (
                                                    <div className="mb-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-5">
                                                        <p className="text-xs font-bold text-indigo-700 mb-3">🎧 Listen to the audio before answering:</p>
                                                        <audio controls className="w-full" src={currentQuestion.audioUrl}>
                                                            Your browser does not support audio.
                                                        </audio>
                                                    </div>
                                                )}
                                                {/* Reading passage */}
                                                {currentQuestion.passage && (
                                                    <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
                                                        <p className="text-xs font-bold text-emerald-700 mb-2">📖 Read the following passage:</p>
                                                        <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap italic">{currentQuestion.passage}</div>
                                                    </div>
                                                )}
                                                <h3 className="font-bold text-gray-900 leading-relaxed mb-4">
                                                    {currentQuestionIdx + 1}. {currentQuestion.question}
                                                </h3>
                                                {/* Word limit for writing */}
                                                {currentQuestion.wordLimit && (currentQuestion.questionType === "WRITING" || currentQuestion.questionType === "SPEAKING") && (
                                                    <p className="text-xs text-gray-500 mb-3">📝 Word limit: <strong>{currentQuestion.wordLimit} words</strong></p>
                                                )}
                                                {isCurrentAutoGraded ? (
                                                    <div className="space-y-3">
                                                        {currentQuestion.options.map((option, index) => {
                                                            const isSelected = answers[currentQuestionIdx] === index
                                                            return (
                                                                <button
                                                                    key={`${currentQuestion.id}-${index}`}
                                                                    onClick={() => selectAnswer(index)}
                                                                    className={`w-full rounded-2xl border-2 p-4 text-left transition-all ${isSelected
                                                                        ? "border-[#1a237e] bg-[#e8eaf6] text-[#1a237e]"
                                                                        : "border-gray-200 hover:border-[#c5cae9] hover:bg-gray-50"
                                                                        }`}
                                                                >
                                                                    <span className="inline-flex w-7 h-7 rounded-full border items-center justify-center mr-3 text-xs font-bold">
                                                                        {String.fromCharCode(65 + index)}
                                                                    </span>
                                                                    <span className="text-sm font-semibold">{option}</span>
                                                                </button>
                                                            )
                                                        })}
                                                    </div>
                                                ) : currentQuestion.questionType === "SPEAKING" ? (
                                                    <SpeakingQuestion
                                                        audioUrl={currentQuestion.audioUrl}
                                                        transcription={typeof answers[currentQuestionIdx] === "string" ? answers[currentQuestionIdx] as string : ""}
                                                        onTranscription={writeAnswer}
                                                        disabled={submitted}
                                                    />
                                                ) : (
                                                    <div className="space-y-3">
                                                        <textarea
                                                            value={typeof answers[currentQuestionIdx] === "string" ? answers[currentQuestionIdx] as string : ""}
                                                            onChange={(e) => writeAnswer(e.target.value)}
                                                            placeholder="Write your answer here."
                                                            className="w-full min-h-40 rounded-2xl border-2 border-gray-200 p-4 text-sm text-gray-900 focus:border-[#1a237e] focus:outline-none focus:ring-2 focus:ring-[#1a237e]/10"
                                                        />
                                                        <p className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-700">
                                                            This writing task is open-ended and will be checked automatically by the system when you submit.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => setCurrentQuestionIdx((value) => Math.max(0, value - 1))}
                                                    disabled={currentQuestionIdx === 0}
                                                    className="flex-1 rounded-full"
                                                >
                                                    Previous
                                                </Button>
                                                {currentQuestionIdx < selectedTest.questions.length - 1 ? (
                                                    <Button
                                                        onClick={() => setCurrentQuestionIdx((value) => Math.min(selectedTest.questions.length - 1, value + 1))}
                                                        disabled={isCurrentAutoGraded ? answers[currentQuestionIdx] === undefined : !(typeof answers[currentQuestionIdx] === "string" && (answers[currentQuestionIdx] as string).trim())}
                                                        className="flex-1 rounded-full bg-[#1a237e] hover:bg-[#283593] text-white"
                                                    >
                                                        Next Question
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        onClick={handleSubmitForReview}
                                                        disabled={!allAnswered || submitting}
                                                        className="flex-1 rounded-full bg-[#2e7d32] hover:bg-[#388e3c] text-white"
                                                    >
                                                        {submitting ? (
                                                            <>
                                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...
                                                            </>
                                                        ) : (
                                                            "Submit Mock Test"
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="space-y-6">
                                            {submissionError && (
                                                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
                                                    {submissionError}
                                                </div>
                                            )}
                                            <div className="text-center rounded-3xl bg-gray-50 border border-gray-100 p-6">
                                                <div
                                                    className={`w-24 h-24 rounded-full mx-auto flex items-center justify-center mb-4 border-4 ${passed ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200"}`}
                                                >
                                                    <span className={`text-3xl font-black ${passed ? "text-emerald-600" : "text-red-500"}`}>
                                                        {autoGradedQuestions.length > 0 ? `${score}%` : "Checked"}
                                                    </span>
                                                </div>
                                                <h3 className="text-2xl font-black text-gray-900">
                                                    {autoGradedQuestions.length > 0 ? (passed ? "Ready for the next level" : "Keep practicing") : "Submitted & auto-checked"}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-1">
                                                    {autoGradedQuestions.length > 0
                                                        ? `You answered ${correctCount} of ${autoGradedQuestions.length} auto-graded questions correctly.`
                                                        : "Your open-ended responses have been checked automatically by the system."}
                                                </p>
                                                {autoGradedQuestions.length > 0 && (
                                                    <span
                                                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 mt-3 text-xs font-bold ${passed ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
                                                    >
                                                        {passed ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                                        {passed ? "Passed" : `Need ${selectedTest.passMark}%`}
                                                    </span>
                                                )}
                                                {submissionData && (
                                                    <div className="mt-4 rounded-2xl border border-indigo-200 bg-indigo-50 p-4 text-left">
                                                        <p className="text-xs font-bold text-indigo-700 mb-1">
                                                            ✍️ Expression Écrite & Expression Orale — Auto-checked
                                                        </p>
                                                        <p className="text-xs text-indigo-900 leading-relaxed">
                                                            Your writing/speaking responses have been checked automatically. This is your final score — see the detailed feedback below.
                                                        </p>
                                                        {submissionData.totalScore !== null && submissionData.totalPossible > 0 && (
                                                            <p className="text-sm font-bold text-indigo-900 mt-2">
                                                                Auto-check score: {submissionData.totalScore}/{submissionData.totalPossible * 10} ({Math.round((submissionData.totalScore / (submissionData.totalPossible * 10)) * 100)}%)
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="space-y-4">
                                                {selectedTest.questions.map((question, index) => {
                                                    const userAnswer = answers[index]
                                                    const isAutoGraded = question.questionType === "MULTIPLE_CHOICE" || question.questionType === "FILL_IN_BLANK"
                                                    const isCorrect = userAnswer === question.correctAnswer
                                                    const autoScore = submissionData?.autoScores?.find((s) => s.questionIndex === index)
                                                    return (
                                                        <div key={question.id} className="rounded-2xl border border-gray-200 p-4">
                                                            <p className="font-bold text-sm text-gray-900 mb-3">
                                                                {isAutoGraded ? (isCorrect ? "Correct" : "Review") : "Open-ended response"}: {question.question}
                                                            </p>
                                                            {isAutoGraded ? (
                                                                <div className="grid sm:grid-cols-2 gap-2">
                                                                    {question.options.map((option, optionIndex) => (
                                                                        <div
                                                                            key={`${question.id}-${optionIndex}`}
                                                                            className={`rounded-xl border px-3 py-2 text-xs font-semibold ${optionIndex === question.correctAnswer
                                                                                ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                                                                                : optionIndex === userAnswer
                                                                                    ? "border-red-200 bg-red-50 text-red-900"
                                                                                    : "border-gray-100 bg-white text-gray-500"
                                                                                }`}
                                                                        >
                                                                            {optionIndex === question.correctAnswer ? "Correct: " : ""}{option}
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-3">
                                                                    <div className="rounded-xl border border-gray-200 bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-wrap">
                                                                        {typeof userAnswer === "string" && userAnswer.trim() ? userAnswer : "No response provided."}
                                                                    </div>
                                                                    {autoScore && (
                                                                        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                                                                            <div className="flex items-center justify-between mb-2">
                                                                                <p className="text-xs font-bold text-amber-700">🤖 Auto-check</p>
                                                                                <span className="text-xs font-bold text-amber-800 rounded-full bg-amber-200 px-2 py-0.5">
                                                                                    {autoScore.score}/10
                                                                                </span>
                                                                            </div>
                                                                            <p className="text-xs text-amber-900 leading-relaxed whitespace-pre-wrap">{autoScore.feedback}</p>
                                                                        </div>
                                                                    )}
                                                                    {!autoScore && (
                                                                        <p className="text-xs text-gray-500 italic">
                                                                            Submit your answers to receive automatic feedback for this response.
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                            {question.explanation && (
                                                                <p className="text-xs text-gray-600 mt-3 bg-blue-50 border border-blue-100 rounded-xl p-3">
                                                                    {question.explanation}
                                                                </p>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>

                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <Button variant="outline" onClick={resetCurrentTest} className="flex-1 rounded-full font-semibold">
                                                    <RefreshCcw className="w-4 h-4 mr-2" /> Try Again
                                                </Button>
                                                <Link href="/register" className="flex-1">
                                                    <Button className="w-full rounded-full bg-[#1a237e] hover:bg-[#283593] text-white font-semibold">
                                                        Create Account for Full Courses
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </Card>
                    </div>
                </section>
            </main>
        </div>
    )
}
