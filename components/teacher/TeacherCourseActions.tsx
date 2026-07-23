"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Trash2 } from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"

export function TeacherCourseActions({ courseId }: { courseId: string }) {
  const router = useRouter()
  const { showToast } = useToast()
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (!confirm("Delete this course? This action cannot be undone.")) return
    setDeleting(true)
    try {
      await fetch(`/api/courses/${courseId}`, { method: "DELETE" })
      showToast("Course deleted successfully.", "success")
      router.refresh()
    } catch {
      showToast("Failed to delete course.")
      setDeleting(false)
    }
  }

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className="text-slate-400 hover:text-red-600 disabled:opacity-40 transition-colors"
      title="Delete course"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}
