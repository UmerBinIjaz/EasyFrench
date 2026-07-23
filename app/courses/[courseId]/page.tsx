"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BookOpen, Layers, Lock, ChevronDown, ChevronRight, GraduationCap, ArrowLeft, FileText, HelpCircle, ArrowRight, ClipboardList } from "lucide-react"
import Link from "next/link"

type QuizItem = {
    id: string
    title: string
    type: "QUIZ" | "EXERCISE"
    passMark: number
    timeLimit: number | null
    _count: { questions: number }
}

type Lesson = {
    id: string
    title: string
    description: string | null
    order: number
    quizzes: QuizItem[]
}

type Course = {
    id: string
    title: string
    description: string
    imageUrl: string | null
    status: string
    lessons: Lesson[]
    quizzes: QuizItem[]
}

export default function PublicCourseDetailPage() {
    const params = useParams()
    const router = useRouter()
    const courseId = params.courseId as string

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/courses/public/${courseId}`)
                if (!res.ok) throw new Error("Course not found")
                const data = await res.json()
                setCourse(data)
            } catch (err: any) {
                setError(err.message || "Failed to load course")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [courseId])

    if (loading) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
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

    if (error || !course) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col">
                <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center gap-3">
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

    const totalLessons = course.lessons.length
    const totalQuizzes = (course.quizzes?.length || 0) + course.lessons.reduce((a: number, l: any) => a + (l.quizzes?.length || 0), 0)

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
                    <Link
                        href="/register"
                        className="text-xs sm:text-sm font-semibold bg-[#1a237e] text-white px-4 py-2 rounded-lg hover:bg-[#283593] transition-colors shadow-sm touch-target"
                    >
                        Get Started Free
                    </Link>
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

                {/* Course Header */}
                <div className="mb-8 sm:mb-10">
                    {course.imageUrl && (
                        <div className="aspect-video relative rounded-2xl overflow-hidden mb-6 sm:mb-8 border border-gray-200">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={course.imageUrl}
                                alt={course.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                        </div>
                    )}

                    <div className="flex flex-col md:flex-row items-start gap-4 sm:gap-6">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#1a237e]/10 text-[#1a237e] rounded-2xl flex items-center justify-center shrink-0">
                            <Layers className="w-7 h-7 sm:w-8 sm:h-8" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    {totalLessons} Lesson{totalLessons !== 1 ? "s" : ""}{totalQuizzes > 0 ? ` · ${totalQuizzes} Assessment${totalQuizzes !== 1 ? "s" : ""}` : ""}
                                </span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 break-words">
                                {course.title}
                            </h1>
                            <p className="text-gray-500 text-sm md:text-base max-w-2xl leading-relaxed">
                                {course.description}
                            </p>
                        </div>
                    </div>
                </div>

                {/* CTA Banner */}
                <Card className="p-5 sm:p-6 mb-8 sm:mb-10 bg-gradient-to-r from-[#1a237e] to-[#283593] border-0 rounded-2xl shadow-md">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="text-center sm:text-left">
                            <h3 className="text-white font-bold text-base sm:text-lg mb-1">Ready to start learning?</h3>
                            <p className="text-blue-200 text-xs sm:text-sm">Create a free account to access all lessons and track your progress.</p>
                        </div>
                        <Link
                            href="/register"
                            className="inline-flex items-center gap-2 bg-white text-[#1a237e] px-5 py-2.5 rounded-lg font-bold text-sm hover:bg-gray-100 transition-colors shadow-sm touch-target whitespace-nowrap shrink-0"
                        >
                            Get Started Free <ArrowRight className="w-4 h-4" />
                        </Link>
                    </div>
                </Card>

                {/* Curriculum Section */}
                <div>
                    <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-6">Course Curriculum</h2>

                    {course.lessons.length === 0 ? (
                        <Card className="p-8 sm:p-12 text-center rounded-2xl border-gray-200 shadow-sm bg-white">
                            <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-7 h-7 text-gray-300" />
                            </div>
                            <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1">Curriculum coming soon</h3>
                            <p className="text-sm text-gray-500">This course is still being built. Check back later!</p>
                        </Card>
                    ) : (
                        <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                            <div className="space-y-1 py-1">
                                {course.lessons.map((lesson) => (
                                    <div key={lesson.id} className="border-b border-gray-50 last:border-0 pb-1">
                                        <div
                                            className="flex items-center gap-3 px-4 py-3 rounded-lg opacity-60 cursor-not-allowed"
                                        >
                                            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                                <Lock className="w-3.5 h-3.5 text-gray-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-sm font-medium text-gray-500 line-clamp-1">
                                                    {lesson.title}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-medium text-gray-400 uppercase shrink-0 flex items-center gap-1">
                                                <Lock className="w-3 h-3" /> Locked
                                            </span>
                                        </div>
                                        {/* Lesson-level quizzes */}
                                        {lesson.quizzes?.map((quiz) => (
                                            <Link
                                                key={quiz.id}
                                                href={`/courses/${course.id}/quizzes`}
                                                className="flex items-center gap-3 px-3 py-2 ml-10 rounded-lg hover:bg-green-50 transition-colors group border-l-2 border-green-200 mr-2"
                                            >
                                                <div className="w-6 h-6 rounded-lg bg-green-100 flex items-center justify-center shrink-0">
                                                    <ClipboardList className="w-3.5 h-3.5 text-green-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <span className="text-sm font-medium text-green-700 group-hover:text-green-900 line-clamp-1">
                                                        {quiz.title}
                                                    </span>
                                                    <p className="text-[10px] text-green-500 font-medium uppercase">
                                                        {quiz.type} · {quiz._count?.questions || 0} Question{(quiz._count?.questions || 0) !== 1 ? "s" : ""}
                                                    </p>
                                                </div>
                                                <span className="text-[10px] font-semibold text-green-600 uppercase shrink-0 border border-green-200 rounded-md px-2 py-0.5 group-hover:bg-green-100 transition-colors">
                                                    Try Free
                                                </span>
                                            </Link>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </Card>
                    )}
                </div>

                {/* Course-level quizzes */}
                {course.quizzes?.length > 0 && (
                    <div className="mt-8">
                        <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">Final Course Assessments</h3>
                        <div className="space-y-3">
                            {course.quizzes.map((quiz) => (
                                <Card key={quiz.id} className="p-4 sm:p-5 flex items-center justify-between bg-white border border-indigo-200 rounded-xl hover:border-indigo-300 transition-colors hover:shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                                            <ClipboardList className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div>
                                            <span className="font-bold text-indigo-800 text-base">{quiz.title}</span>
                                            <p className="text-xs text-indigo-500 uppercase tracking-wider">
                                                {quiz.type} · {quiz._count?.questions || 0} Question{(quiz._count?.questions || 0) !== 1 ? "s" : ""}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/courses/${course.id}/quizzes`}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm touch-target shrink-0"
                                    >
                                        Try Free
                                    </Link>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Try Free Quizzes Link */}
                <div className="mt-8 sm:mt-10 text-center">
                    <Link
                        href={`/courses/${course.id}/quizzes`}
                        className="inline-flex items-center gap-2 bg-[#2e7d32] text-white px-5 py-2.5 rounded-lg font-semibold text-sm hover:bg-[#388e3c] transition-colors shadow-sm touch-target"
                    >
                        <HelpCircle className="w-4 h-4" /> Try Free Quizzes
                    </Link>
                    <p className="text-xs text-gray-400 mt-2">No registration required for quizzes</p>
                </div>
            </main>
        </div>
    )
}