"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
    ArrowLeft, BookOpen, Layers, Eye,
    FileText, Video, Award, FileQuestion, AlertCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

type Quiz = { id: string; title: string; type: "QUIZ" | "EXERCISE" }
type Lesson = { id: string; title: string; content: string; videoUrl: string; pdfUrl: string; order: number; quizzes?: Quiz[] }
type Course = {
    id: string
    title: string
    description: string
    status: string
    imageUrl?: string | null
    certificateTemplateId: string | null
    lessons: Lesson[]
    quizzes?: Quiz[]
}

const ITEM_TYPE_ICON: Record<string, React.ReactNode> = {
    video: <Video className="w-4 h-4 text-[#1a237e]" />,
    text: <FileText className="w-4 h-4 text-gray-500" />,
    quiz: <FileQuestion className="w-4 h-4 text-[#6a1b9a]" />,
}

export default function TeacherCoursePreviewPage() {
    const params = useParams()
    const courseId = params?.courseId as string

    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                const courseRes = await fetch(`/api/courses/${courseId}`)
                const data = await courseRes.json()
                setCourse(data)
            } catch {
                setError("Failed to load course.")
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [courseId])


    if (loading) return (
        <div className="space-y-3 animate-pulse p-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}
        </div>
    )

    if (error || !course) return (
        <div className="text-center py-16 text-gray-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-3 text-gray-400" />
            <p>{error || "Course not found."}</p>
            <Link href="/teacher/courses" className="inline-flex items-center gap-1.5 mt-4 text-sm font-bold text-[#1a237e] hover:underline">
                <ArrowLeft className="w-4 h-4" /> Back to Courses
            </Link>
        </div>
    )

    const totalLessons = course.lessons.length
    const totalQuizzes = (course.quizzes?.length || 0) +
        course.lessons.reduce((a, l) => a + (l.quizzes?.length || 0), 0)

    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            {/* ── Page Header ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-gray-200">
                <div className="flex items-center gap-3 min-w-0">
                    <Link href="/teacher/courses"
                        className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
                        <ArrowLeft className="w-4 h-4" />
                    </Link>
                    <div className="min-w-0">
                        <div className="text-xs text-gray-400 font-medium mb-0.5">← Course Preview</div>
                        <h1 className="text-lg font-bold text-gray-900 truncate">{course.title}</h1>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Link href={`/teacher/courses/${courseId}`}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                        <BookOpen className="w-3.5 h-3.5" /> Edit Course
                    </Link>
                    {course.status === "PUBLISHED" && (
                        <Link href={`/courses/${courseId}`} target="_blank"
                            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
                            <Eye className="w-3.5 h-3.5" /> Public View
                        </Link>
                    )}
                </div>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-3 mb-6">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${course.status === "PUBLISHED"
                        ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                        : "bg-slate-50 text-slate-500 border-slate-200"
                    }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${course.status === "PUBLISHED" ? "bg-emerald-500" : "bg-slate-400"}`} />
                    {course.status}
                </span>
                <span className="text-xs text-gray-400">
                    {totalLessons} lesson{totalLessons !== 1 ? "s" : ""} &middot; {totalQuizzes} quiz{totalQuizzes !== 1 ? "zes" : ""}
                </span>
            </div>

            {/* ── Course Thumbnail ── */}
            {course.imageUrl && (
                <div className="relative aspect-video rounded-2xl overflow-hidden mb-8 border border-gray-200 shadow-sm">
                    <Image
                        src={course.imageUrl}
                        alt={course.title}
                        fill
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
            )}

            {/* ── Course Description ── */}
            {course.description && (
                <Card className="p-5 sm:p-6 mb-8 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#e8eaf6] flex items-center justify-center text-[#1a237e] shrink-0">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-gray-900 mb-2">About This Course</h2>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{course.description}</p>
                        </div>
                    </div>
                </Card>
            )}

            {/* ── Course Curriculum ── */}
            <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#e8eaf6] flex items-center justify-center text-[#1a237e] shrink-0">
                        <Layers className="w-4 h-4" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Course Curriculum</h2>
                        <p className="text-xs text-gray-500">{totalLessons} lessons</p>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    {course.lessons.length === 0 ? (
                        <div className="py-12 text-center text-gray-400">
                            <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm font-medium">No lessons yet.</p>
                        </div>
                    ) : (
                        course.lessons.map((lesson, lIdx) => (
                            <div key={lesson.id} className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 sm:px-5 py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                        {lesson.videoUrl ? ITEM_TYPE_ICON.video : ITEM_TYPE_ICON.text}
                                    </div>
                                    <span className="text-[10px] text-gray-400 font-bold w-6 shrink-0">{lIdx + 1}</span>
                                    <div className="flex-1 min-w-0">
                                        <span className="text-sm font-medium text-gray-800 truncate block">{lesson.title}</span>
                                        {lesson.videoUrl && (
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                                <Video className="w-3 h-3" /> Video available
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Lesson quizzes */}
                                {lesson.quizzes && lesson.quizzes.length > 0 && (
                                    <div className="flex items-center gap-1.5 shrink-0 sm:ml-auto pl-10 sm:pl-0">
                                        {lesson.quizzes.map(q => (
                                            <span key={q.id}
                                                className="text-[10px] px-2 py-0.5 bg-[#ede7f6] text-[#6a1b9a] rounded-full font-bold flex items-center gap-1">
                                                <Award className="w-2.5 h-2.5" /> {q.title}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── Course Final Assessments ── */}
            {course.quizzes && course.quizzes.length > 0 && (
                <Card className="p-5 sm:p-6 bg-white border border-gray-200 rounded-xl shadow-sm mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 rounded-lg bg-[#ede7f6] flex items-center justify-center text-[#6a1b9a] shrink-0">
                            <Award className="w-4 h-4" />
                        </div>
                        <div>
                            <h2 className="text-sm font-bold text-gray-900">Course Final Assessments</h2>
                            <p className="text-xs text-gray-500">Quizzes or exercises that test the entire course.</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {course.quizzes.map(q => (
                            <span key={q.id}
                                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 bg-[#ede7f6] text-[#6a1b9a] rounded-full border border-[#d1c4e9]">
                                <Award className="w-3 h-3" /> {q.title}
                                <span className="text-[9px] opacity-70 uppercase bg-[#d1c4e9] px-1 py-0.5 rounded">{q.type}</span>
                            </span>
                        ))}
                    </div>
                </Card>
            )}

            {/* ── Footer Actions ── */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
                <Link href="/teacher/courses"
                    className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="w-4 h-4" /> Back to Courses
                </Link>
                <Link href={`/teacher/courses/${courseId}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1a237e] text-white text-xs font-bold rounded-lg hover:bg-[#283593] transition-colors shadow-sm">
                    <BookOpen className="w-3.5 h-3.5" /> Edit This Course
                </Link>
            </div>
        </div>
    )
}