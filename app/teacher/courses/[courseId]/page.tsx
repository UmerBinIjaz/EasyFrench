"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Modal } from "@/components/ui/modal"
import {
  ArrowLeft, Plus, Trash2, Edit2,
  Save, Eye, BookOpen, FileText, GripVertical,
  Award, Video, FileQuestion, Tag, X, ToggleLeft, ToggleRight,
  Image as ImageIcon, Upload, Users, GraduationCap,
  Mail, Calendar, CheckCircle, Clock, AlertCircle
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import dynamic from "next/dynamic"
import "react-quill-new/dist/quill.snow.css"
import { useToast } from "@/components/providers/ToastProvider"

const ReactQuill = dynamic(
  async () => {
    const { default: RQ, Quill } = await import("react-quill-new")
    if (typeof window !== "undefined") {
      // @ts-ignore
      window.Quill = Quill
      const ImageResize = (await import("quill-image-resize-module-react")).default
      Quill.register("modules/imageResize", ImageResize)
    }
    return RQ
  },
  { ssr: false }
)

type Quiz = { id: string; title: string; type: "QUIZ" | "EXERCISE" }
type Exercise = { id: string; title: string }
type Lesson = { id: string; title: string; content: string; textContent?: string; videoUrl: string; pdfUrl: string; order: number; quizzes?: Quiz[]; exercises?: Exercise[] }
type Course = { id: string; title: string; description: string; status: string; imageUrl?: string | null; certificateTemplateId: string | null; lessons: Lesson[]; quizzes?: Quiz[]; exercises?: Exercise[] }

const ITEM_TYPE_ICON: Record<string, React.ReactNode> = {
  video: <Video className="w-3.5 h-3.5 text-[#1a237e]" />,
  text: <FileText className="w-3.5 h-3.5 text-gray-500" />,
  quiz: <FileQuestion className="w-3.5 h-3.5 text-[#6a1b9a]" />,
}

export default function CourseBuilderPage() {
  const params = useParams()
  const courseId = params?.courseId as string
  const router = useRouter()
  const { showToast } = useToast()

  const [course, setCourse] = useState<Course | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newLesson, setNewLesson] = useState({ title: "", content: "", videoUrl: "", pdfUrl: "" })
  const [addingLesson, setAddingLesson] = useState(false)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [editingLessonData, setEditingLessonData] = useState<{ title: string; content: string; videoUrl: string; pdfUrl: string }>({ title: "", content: "", videoUrl: "", pdfUrl: "" })

  // Students modal state
  const [studentsOpen, setStudentsOpen] = useState(false)
  const [studentsData, setStudentsData] = useState<{
    courseTitle: string
    totalEnrolled: number
    students: Array<{
      id: string
      enrolledAt: string
      status: string
      completedAt: string | null
      student: { id: string; name: string; email: string; avatar: string | null; createdAt: string }
      progress: { completedLessons: number; totalLessons: number; percentage: number }
      avgQuizScore: number | null
    }>
  } | null>(null)
  const [loadingStudents, setLoadingStudents] = useState(false)

  // Metadata panel state
  const [metaOpen, setMetaOpen] = useState(true)
  const [quickDesc, setQuickDesc] = useState("")
  const [tags, setTags] = useState<string[]>(["French", "Language"])
  const [tagInput, setTagInput] = useState("")

  // Thumbnail upload
  const thumbnailInputRef = useRef<HTMLInputElement>(null)
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const quillModules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote'],
        [{'list': 'ordered'}, {'list': 'bullet'}, {'indent': '-1'}, {'indent': '+1'}],
        ['link', 'image'],
        ['clean']
      ],
      handlers: {
        image: function() {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.click();

          input.onchange = async () => {
            const file = input.files ? input.files[0] : null;
            if (!file) return;

            const formData = new FormData();
            formData.append('file', file);

            try {
              const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
              });
              const data = await res.json();
              if (data.url) {
                // @ts-ignore
                const quill = this.quill;
                const range = quill.getSelection();
                const position = range ? range.index : 0;
                quill.insertEmbed(position, 'image', data.url);
              }
            } catch (err) {
              console.error('Upload failed:', err);
            }
          };
        }
      }
    },
    imageResize: {
      modules: ['Resize', 'DisplaySize']
    }
  }), []);

  useEffect(() => {
    async function load() {
      try {
        const courseRes = await fetch(`/api/courses/${courseId}`)
        const data = await courseRes.json()
        setCourse(data)
        setQuickDesc(data.description ?? "")
      } catch {
        showToast("Failed to load course.")
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [courseId, showToast])

  const handleAddLesson = async () => {
    if (!newLesson.title.trim()) return
    setAddingLesson(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/lessons`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newLesson.title,
          textContent: newLesson.content || "",
          description: newLesson.content || "",
          videoUrl: newLesson.videoUrl || "",
          pdfUrl: newLesson.pdfUrl || "",
          order: course?.lessons.length ?? 0,
        }),
      })
      const created = await res.json()
      setCourse((prev) => prev ? { ...prev, lessons: [...prev.lessons, created] } : prev)
      setNewLesson({ title: "", content: "", videoUrl: "", pdfUrl: "" })
      showToast("Lesson added successfully!", "success")
    } catch {
      showToast("Failed to add lesson.")
    } finally {
      setAddingLesson(false)
    }
  }

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return
    try {
      await fetch(`/api/lessons/${lessonId}`, { method: "DELETE" })
      setCourse((prev) => prev ? { ...prev, lessons: prev.lessons.filter((l) => l.id !== lessonId) } : prev)
      showToast("Lesson deleted successfully.", "success")
    } catch {
      showToast("Failed to delete lesson.")
    }
  }

  const handleEditLesson = (lesson: Lesson) => {
    setEditingLessonId(lesson.id)
    setEditingLessonData({
      title: lesson.title,
      content: lesson.textContent || lesson.content || "",
      videoUrl: lesson.videoUrl || "",
      pdfUrl: lesson.pdfUrl || ""
    })
  }

  const handleUpdateLesson = async () => {
    if (!editingLessonId) return
    if (!editingLessonData.title.trim()) return
    try {
      const res = await fetch(`/api/lessons/${editingLessonId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingLessonData.title,
          content: editingLessonData.content || "",
          videoUrl: editingLessonData.videoUrl || "",
          pdfUrl: editingLessonData.pdfUrl || "",
        }),
      })
      const updatedLesson = await res.json()
      setCourse((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          lessons: prev.lessons.map(l => l.id === editingLessonId ? { ...l, ...updatedLesson, content: updatedLesson.textContent } : l),
        }
      })
      setEditingLessonId(null)
      showToast("Lesson updated successfully!", "success")
    } catch {
      showToast("Failed to update lesson.")
    }
  }

  const handleAddQuiz = async (targetType: "lesson" | "course", targetId: string) => {
    const title = prompt(`Enter title for the quiz:`)
    if (!title?.trim()) return
    try {
      const res = await fetch(`/api/quizzes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, type: "QUIZ",
          lessonId: targetType === "lesson" ? targetId : undefined,
          courseId: targetType === "course" ? targetId : undefined,
        }),
      })
      const newQuiz = await res.json()
      setCourse((prev) => {
        if (!prev) return prev
        if (targetType === "course") return { ...prev, quizzes: [...(prev.quizzes || []), newQuiz] }
        return {
          ...prev,
          lessons: prev.lessons.map(l => l.id === targetId ? { ...l, quizzes: [...(l.quizzes || []), newQuiz] } : l)
        }
      })
      showToast("Quiz added successfully!", "success")
    } catch {
      showToast("Failed to add quiz.")
    }
  }

  const handleAddExercise = async (targetType: "lesson" | "course", targetId: string) => {
    const title = prompt(`Enter title for the exercise:`)
    if (!title?.trim()) return
    try {
      const res = await fetch(`/api/exercises/crud`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          lessonId: targetType === "lesson" ? targetId : undefined,
          courseId: targetType === "course" ? targetId : undefined,
        }),
      })
      const newExercise = await res.json()
      setCourse((prev) => {
        if (!prev) return prev
        if (targetType === "course") return { ...prev, exercises: [...(prev.exercises || []), newExercise] }
        return {
          ...prev,
          lessons: prev.lessons.map(l => l.id === targetId ? { ...l, exercises: [...(l.exercises || []), newExercise] } : l)
        }
      })
      showToast("Exercise added successfully!", "success")
    } catch {
      showToast("Failed to add exercise.")
    }
  }

  const handlePublish = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: course?.status === "PUBLISHED" ? "DRAFT" : "PUBLISHED" }),
      })
      const updated = await res.json()
      setCourse((prev) => prev ? { ...prev, status: updated.status } : prev)
      showToast(`Course ${updated.status === "PUBLISHED" ? "published" : "set to draft"} successfully.`, "success")
    } catch {
      showToast("Failed to update status.")
    } finally {
      setSaving(false)
    }
  }

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingThumbnail(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      await fetch(`/api/courses/${courseId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl: data.url }),
      })
      setCourse((prev) => prev ? { ...prev, imageUrl: data.url } : prev)
      setThumbnailPreview(data.url)
      showToast("Thumbnail uploaded successfully.", "success")
    } catch (err: any) {
      showToast(err.message || "Failed to upload thumbnail")
    } finally {
      setUploadingThumbnail(false)
    }
  }

  const loadStudents = async () => {
    setLoadingStudents(true)
    setStudentsOpen(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/students`)
      const data = await res.json()
      if (res.ok) {
        setStudentsData(data)
      } else {
        showToast(data.error || "Failed to load students.")
        setStudentsOpen(false)
      }
    } catch {
      showToast("Failed to load students.")
      setStudentsOpen(false)
    } finally {
      setLoadingStudents(false)
    }
  }

  if (loading) return (
    <div className="space-y-3 animate-pulse p-2">
      {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-gray-200 rounded-xl" />)}
    </div>
  )

  if (!course) return (
    <div className="text-center py-16 text-gray-500">Course not found.</div>
  )

  return (
    <div className="animate-fade-in max-w-7xl mx-auto">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-gray-200">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/teacher/courses"
            className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="min-w-0">
            <div className="text-xs text-gray-400 font-medium mb-0.5">← Course Builder</div>
            <h1 className="text-lg font-bold text-gray-900 truncate">{course.title}</h1>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={loadStudents}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-[#1a237e]/20 bg-[#e8eaf6] text-[#1a237e] rounded-lg hover:bg-[#c5cae9] transition-colors">
            <Users className="w-3.5 h-3.5" /> View Students
          </button>
          <Link href={`/teacher/courses/${courseId}/preview`}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors">
            <Eye className="w-3.5 h-3.5" /> Preview
          </Link>
          <button
            onClick={handlePublish} disabled={saving}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors">
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button
            onClick={handlePublish} disabled={saving}
            className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg text-white transition-colors shadow-sm ${course.status === "PUBLISHED"
              ? "bg-gray-600 hover:bg-gray-700"
              : "bg-[#2e7d32] hover:bg-[#388e3c]"
              }`}>
            <BookOpen className="w-3.5 h-3.5" />
            {course.status === "PUBLISHED" ? "Unpublish" : "Publish Course"}
          </button>
        </div>
      </div>

      {/* ── Main layout: Builder + Metadata panel ── */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── LEFT: Lesson list ── */}
        <div className="flex-1 min-w-0 space-y-3 w-full lg:w-0">

          {/* Stats bar */}
          <div className="flex items-center gap-2 text-xs text-gray-500 font-medium px-1">
            <BookOpen className="w-3.5 h-3.5 text-[#1a237e]" />
            <span className="font-bold text-gray-700">{course.lessons.length}</span> lesson{course.lessons.length !== 1 ? "s" : ""}
          </div>

          {/* Lesson list */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            {course.lessons.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm font-medium">No lessons yet — add your first lesson below.</p>
              </div>
            ) : (
              course.lessons.map((lesson, lIdx) => (
                editingLessonId === lesson.id ? (
                  <div key={lesson.id} className="px-3 sm:px-5 py-4 bg-indigo-50/50 border-b border-indigo-100 space-y-3">
                    <p className="text-xs font-bold text-[#1a237e] flex items-center gap-1.5">
                      Edit Lesson
                    </p>
                    <Input
                      placeholder="Lesson title"
                      className="h-9 text-sm"
                      value={editingLessonData.title}
                      onChange={(e) => setEditingLessonData(prev => ({ ...prev, title: e.target.value }))}
                    />
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
                      <ReactQuill
                        theme="snow"
                        modules={quillModules}
                        placeholder="Lesson content…"
                        value={editingLessonData.content}
                        onChange={(value) => setEditingLessonData(prev => ({ ...prev, content: value }))}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input
                        placeholder="Video URL (optional)"
                        className="h-9 text-sm"
                        value={editingLessonData.videoUrl}
                        onChange={(e) => setEditingLessonData(prev => ({ ...prev, videoUrl: e.target.value }))}
                      />
                      <Input
                        placeholder="PDF URL (optional)"
                        className="h-9 text-sm"
                        value={editingLessonData.pdfUrl}
                        onChange={(e) => setEditingLessonData(prev => ({ ...prev, pdfUrl: e.target.value }))}
                      />
                    </div>
                    <div className="flex gap-2 pt-1">
                      <Button onClick={handleUpdateLesson} className="h-9 text-xs bg-[#1a237e] hover:bg-[#283593] text-white">Save Changes</Button>
                      <Button onClick={() => setEditingLessonId(null)} variant="outline" className="h-9 text-xs">Cancel</Button>
                    </div>
                  </div>
                ) : (
                  <div key={lesson.id} className="group border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                    {/* Top row */}
                    <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 pt-2.5 pb-1">
                      <GripVertical className="w-3.5 h-3.5 text-gray-300 cursor-grab shrink-0" />
                      <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                        {lesson.videoUrl ? ITEM_TYPE_ICON.video : ITEM_TYPE_ICON.text}
                      </div>
                      <span className="text-[10px] text-gray-400 font-bold w-8 shrink-0">{lIdx + 1}</span>
                      <span className="flex-1 text-sm font-medium text-gray-800 min-w-0">{lesson.title}</span>
                      {/* Edit / Delete actions */}
                      <div className="flex items-center gap-1 opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        <button onClick={() => handleEditLesson(lesson)}
                          className="p-1 text-[#1a237e] hover:bg-[#e8eaf6] rounded-md transition-colors">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteLesson(lesson.id)}
                          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    {/* Bottom row: quiz/exercise badges */}
                    <div className="overflow-x-auto pb-2 px-3 sm:px-5 pl-[calc(0.75rem+1.75rem+0.5rem+2rem)] sm:pl-[calc(1.25rem+1.75rem+0.75rem+2.5rem)]">
                      <div className="flex items-center gap-1.5 w-max">
                        {lesson.quizzes?.map(q => (
                          <Link
                            href={`/teacher/quizzes?quizId=${q.id}`}
                            key={q.id}
                            className="text-[10px] px-2 py-0.5 transition-colors rounded-full font-bold flex items-center gap-1 bg-[#ede7f6] text-[#6a1b9a] hover:bg-[#d1c4e9] whitespace-nowrap">
                            <Award className="w-2.5 h-2.5" /> {q.title}
                            <span className="text-[8px] uppercase px-1 py-[1px] rounded bg-[#d1c4e9] text-[#4a148c]">QZ</span>
                          </Link>
                        ))}
                        {lesson.exercises?.map((ex, exIdx) => (
                          <Link
                            href={`/teacher/exercises?exerciseId=${ex.id}`}
                            key={ex?.id || `ex-lesson-${lesson.id}-${exIdx}`}
                            className="text-[10px] px-2 py-0.5 transition-colors rounded-full font-bold flex items-center gap-1 bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2] whitespace-nowrap">
                            <Award className="w-2.5 h-2.5" /> {ex.title}
                            <span className="text-[8px] uppercase px-1 py-[1px] rounded bg-[#ffe0b2] text-[#bf360c]">EX</span>
                          </Link>
                        ))}
                        <button onClick={() => handleAddQuiz("lesson", lesson.id)}
                          className="text-[10px] text-gray-400 hover:text-[#6a1b9a] px-1.5 py-0.5 rounded transition-colors font-bold whitespace-nowrap">
                          + Quiz
                        </button>
                        <button onClick={() => handleAddExercise("lesson", lesson.id)}
                          className="text-[10px] text-gray-400 hover:text-[#e65100] px-1.5 py-0.5 rounded transition-colors font-bold whitespace-nowrap">
                          + Exercise
                        </button>
                      </div>
                    </div>
                  </div>
                )
              ))
            )}
          </div>

          {/* Add New Lesson */}
          <div className="bg-white rounded-xl border border-dashed border-gray-300 p-4 sm:p-6 hover:border-[#1a237e]/40 transition-colors space-y-3">
            <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-[#1a237e]" /> Add Lesson
            </p>
            <Input
              placeholder="Lesson title (e.g. Bonjour et Salutations)"
              className="h-10 w-full"
              value={newLesson.title}
              onChange={(e) => setNewLesson(prev => ({ ...prev, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAddLesson()}
            />
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden text-sm">
              <ReactQuill
                theme="snow"
                modules={quillModules}
                placeholder="Lesson content…"
                value={newLesson.content}
                onChange={(value) => setNewLesson(prev => ({ ...prev, content: value }))}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                placeholder="Video URL (optional)"
                className="h-9 text-sm"
                value={newLesson.videoUrl}
                onChange={(e) => setNewLesson(prev => ({ ...prev, videoUrl: e.target.value }))}
              />
              <Input
                placeholder="PDF URL (optional)"
                className="h-9 text-sm"
                value={newLesson.pdfUrl}
                onChange={(e) => setNewLesson(prev => ({ ...prev, pdfUrl: e.target.value }))}
              />
            </div>
            <div className="flex justify-end">
              <Button
                className="h-9 px-5 text-xs"
                disabled={addingLesson || !newLesson.title.trim()}
                onClick={handleAddLesson}
              >
                {addingLesson ? <Save className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
                {addingLesson ? "Saving…" : "Add Lesson"}
              </Button>
            </div>
          </div>

          {/* Course Final Assessments */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#ede7f6] flex items-center justify-center text-[#6a1b9a] shrink-0">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">Course Final Assessments</p>
                <p className="text-xs text-gray-500">Quizzes or exercises that test the entire course.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 items-start sm:items-center p-3 rounded-lg bg-gray-50 border border-gray-200">
              <div className="flex flex-wrap gap-2 items-center flex-1">
                {course.quizzes?.map(q => (
                  <Link
                    href={`/teacher/quizzes?quizId=${q.id}`}
                    key={q.id}
                    className="text-xs font-bold px-3 py-1.5 transition-colors rounded-full border flex items-center gap-1.5 bg-[#ede7f6] text-[#6a1b9a] hover:bg-[#d1c4e9] border-[#d1c4e9]">
                    <Award className="w-3 h-3" /> {q.title}
                    <span className="text-[9px] uppercase px-1 py-[1px] rounded bg-[#d1c4e9] text-[#4a148c]">QZ</span>
                  </Link>
                ))}
                {course.exercises?.map((ex, exIdx) => (
                  <Link
                    href={`/teacher/exercises?exerciseId=${ex.id}`}
                    key={ex?.id || `ex-course-${course.id}-${exIdx}`}
                    className="text-xs font-bold px-3 py-1.5 transition-colors rounded-full border flex items-center gap-1.5 bg-[#fff3e0] text-[#e65100] hover:bg-[#ffe0b2] border-[#ffe0b2]">
                    <Award className="w-3 h-3" /> {ex.title}
                    <span className="text-[9px] uppercase px-1 py-[1px] rounded bg-[#ffe0b2] text-[#bf360c]">EX</span>
                  </Link>
                ))}
                {(!course.quizzes || course.quizzes.length === 0) && (!course.exercises || course.exercises.length === 0) && (
                  <span className="text-xs text-gray-400 italic">No final assessments yet.</span>
                )}
              </div>
              <div className="flex gap-2 shrink-0 mt-2 sm:mt-0">
                <button onClick={() => handleAddQuiz("course", course.id)}
                  className="text-xs font-bold text-[#6a1b9a] bg-[#ede7f6] hover:bg-[#d1c4e9] px-3 py-1.5 rounded-lg transition-colors">
                  + Add Quiz
                </button>
                <button onClick={() => handleAddExercise("course", course.id)}
                  className="text-xs font-bold text-[#e65100] bg-[#fff3e0] hover:bg-[#ffe0b2] px-3 py-1.5 rounded-lg transition-colors">
                  + Add Exercise
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT: Course Metadata Panel ── */}
        {metaOpen && (
          <div className="w-full lg:w-80 shrink-0 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <h3 className="text-sm font-bold text-[#1a237e]">Course Metadata</h3>
              <button onClick={() => setMetaOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="p-4 space-y-5">
              {/* Thumbnail */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Course Thumbnail</p>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailUpload}
                />
                {(thumbnailPreview || course?.imageUrl) ? (
                  <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-200 bg-gray-50 group">
                    <Image
                      src={thumbnailPreview || course?.imageUrl || ""}
                      alt="Course thumbnail"
                      fill
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/30 lg:bg-black/0 lg:group-hover:bg-black/30 transition-colors flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => thumbnailInputRef.current?.click()}
                        disabled={uploadingThumbnail}
                        className="opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 disabled:opacity-50"
                      >
                        {uploadingThumbnail ? "Uploading..." : "Change"}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => thumbnailInputRef.current?.click()}
                    disabled={uploadingThumbnail}
                    className="w-full aspect-video rounded-lg border-2 border-dashed border-gray-200 bg-gray-50 hover:border-[#1a237e]/40 hover:bg-[#f3f4fb] transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploadingThumbnail ? (
                      <>
                        <div className="w-5 h-5 border-2 border-[#1a237e] border-t-transparent rounded-full animate-spin" />
                        <span className="text-xs text-gray-400 font-medium">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-5 h-5 text-gray-400" />
                        <span className="text-xs text-gray-400 font-medium">Click to upload</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Description */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Quick Description</p>
                <div className="rounded-lg border border-gray-200 bg-gray-50 overflow-hidden focus-within:ring-2 focus-within:ring-[#1a237e]/20 focus-within:border-[#1a237e] transition-colors">
                  <ReactQuill
                    theme="snow"
                    placeholder="Briefly describe the learning objectives…"
                    value={quickDesc}
                    onChange={(value) => setQuickDesc(value)}
                    modules={{
                      toolbar: [
                        [{ header: [1, 2, 3, false] }],
                        ["bold", "italic", "underline", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link", "blockquote"],
                        ["clean"],
                      ],
                    }}
                    className="quick-desc-editor"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="pt-3 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-700 mb-2">Course Tags</p>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tags.map(tag => (
                    <span key={tag} className="inline-flex items-center gap-1 bg-[#e8eaf6] text-[#1a237e] text-[10px] font-bold px-2.5 py-1 rounded-full">
                      {tag}
                      <button onClick={() => setTags(t => t.filter(x => x !== tag))} className="hover:text-red-500 transition-colors">
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </span>
                  ))}
                  <button
                    onClick={() => { const t = prompt("Add tag:"); if (t?.trim()) setTags(p => [...p, t.trim()]) }}
                    className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500 border border-dashed border-gray-300 px-2.5 py-1 rounded-full hover:border-[#1a237e] hover:text-[#1a237e] transition-colors"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add Tag
                  </button>
                </div>
              </div>

              {/* Discard */}
              <div className="pt-3 border-t border-gray-100">
                <button className="w-full flex items-center justify-center gap-2 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-bold hover:bg-red-50 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Discard Changes
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Open metadata panel button */}
        {!metaOpen && (
          <button
            onClick={() => setMetaOpen(true)}
            className="shrink-0 px-3 py-2 text-xs font-bold text-[#1a237e] bg-[#e8eaf6] border border-[#c5cae9] rounded-lg hover:bg-[#c5cae9] transition-colors w-full lg:w-auto"
          >
            Metadata ▶
          </button>
        )}

        {/* ── Students Modal ── */}
        <Modal
          isOpen={studentsOpen}
          onClose={() => { setStudentsOpen(false); setStudentsData(null) }}
          title=""
          className="max-w-3xl"
        >
          {loadingStudents ? (
            <div className="flex items-center justify-center py-16">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[#1a237e] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">Loading students...</p>
              </div>
            </div>
          ) : studentsData ? (
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{studentsData.courseTitle}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    <span className="font-semibold text-[#1a237e]">{studentsData.totalEnrolled}</span> student{studentsData.totalEnrolled !== 1 ? "s" : ""} enrolled
                  </p>
                </div>
              </div>

              {studentsData.students.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-500">No students enrolled yet</p>
                  <p className="text-xs text-gray-400 mt-1">Students will appear here once they enroll in the course.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                  {studentsData.students.map((enrollment) => {
                    const initial = enrollment.student.name?.charAt(0)?.toUpperCase() ?? "?"
                    const scoreColor = enrollment.avgQuizScore !== null
                      ? enrollment.avgQuizScore >= 80 ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                        : enrollment.avgQuizScore >= 60 ? "text-amber-600 bg-amber-50 border-amber-200"
                          : "text-rose-600 bg-rose-50 border-rose-200"
                      : "text-gray-400 bg-gray-50 border-gray-200"

                    return (
                      <div key={enrollment.id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-[#1a237e] flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900 truncate">{enrollment.student.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${enrollment.status === "ACTIVE" ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                              : enrollment.status === "COMPLETED" ? "text-blue-600 bg-blue-50 border-blue-200"
                                : "text-gray-600 bg-gray-50 border-gray-200"
                              }`}>
                              {enrollment.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {enrollment.student.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" /> Enrolled {new Date(enrollment.enrolledAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="mt-3 flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2">
                              <div className="w-28 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${enrollment.progress.percentage}%`,
                                    backgroundColor: enrollment.progress.percentage === 100 ? "#16a34a" : "#1a237e"
                                  }}
                                />
                              </div>
                              <span className="text-[11px] font-semibold text-gray-600">
                                {enrollment.progress.completedLessons}/{enrollment.progress.totalLessons} lessons
                              </span>
                            </div>
                            <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${scoreColor}`}>
                              <FileQuestion className="w-3 h-3" />
                              {enrollment.avgQuizScore !== null ? `${enrollment.avgQuizScore}%` : "N/A"}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-sm text-gray-500">No data available.</div>
          )}
        </Modal>
      </div>
    </div>
  )
}
