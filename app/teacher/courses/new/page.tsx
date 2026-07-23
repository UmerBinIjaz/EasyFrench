"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ArrowLeft, BookOpen, Upload, X } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useToast } from "@/components/providers/ToastProvider"

export default function NewCoursePage() {
  const router = useRouter()
  const { showToast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    title: "",
    description: "",
    thumbnail: "",
    status: "DRAFT",
  })

  const [preview, setPreview] = useState<string | null>(null)

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show local preview immediately
    setPreview(URL.createObjectURL(file))

    // Upload to server
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      setForm((prev) => ({ ...prev, thumbnail: data.url }))
    } catch (err: any) {
      showToast(err.message || "Failed to upload image")
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  const handleRemoveThumbnail = () => {
    setForm((prev) => ({ ...prev, thumbnail: "" }))
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) { showToast("Course title is required."); return }
    setSaving(true)

    try {
      const res = await fetch("/api/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          status: form.status,
          imageUrl: form.thumbnail,
        }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || "Failed to create course."); return }
      showToast("Course created successfully!", "success")
      router.push(`/teacher/courses/${data.id}`)
    } catch {
      showToast("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-2">
        <Link href="/teacher/courses" className="text-gray-600-400 hover:text-gray-900 flex items-center gap-2 text-sm font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl transition-colors border border-white/5 hover:border-white/10">
          <ArrowLeft className="w-4 h-4" /> Back to Courses
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Create New Course</h1>
        <p className="text-gray-600-400 font-medium">Fill in the details to add a new French language course.</p>
      </div>

      <Card className="p-8 bg-white/5 backdrop-blur-md border-white/10 rounded-3xl shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-gray-600-300 mb-2">Course Title *</label>
            <Input
              value={form.title}
              onChange={(e) => handleChange("title", e.target.value)}
              placeholder="e.g. French for Beginners (A1)"
              className="bg-white/5 border-gray-300 text-gray-900 placeholder:text-gray-600-500 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl h-12"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600-300 mb-2">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => handleChange("description", e.target.value)}
              placeholder="Describe what students will learn in this course..."
              rows={4}
              className="w-full px-4 py-3 bg-white/5 border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-600-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600-300 mb-2">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
              className="w-full px-4 py-3 bg-white/5 border border-gray-300 rounded-xl text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-colors [&>option]:bg-white"
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-600-300 mb-2">Course Thumbnail</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
            {preview ? (
              <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-300 bg-gray-50 group">
                <Image
                  src={preview}
                  alt="Thumbnail preview"
                  fill
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-white text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveThumbnail}
                      className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full aspect-video rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex flex-col items-center justify-center gap-2 disabled:opacity-50"
              >
                {uploading ? (
                  <>
                    <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-gray-500 font-medium">Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 font-medium">Click to upload thumbnail</span>
                    <span className="text-[10px] text-gray-400">PNG, JPG, WebP up to 5MB</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="flex items-center justify-between pt-6 mt-8 border-t border-white/10">
            <Link href="/teacher/courses" className="text-sm font-bold text-gray-600-400 hover:text-gray-900 transition-colors px-4 py-2 rounded-lg hover:bg-white/5">
              Cancel
            </Link>
            <Button type="submit" disabled={saving} className="bg-indigo-500 hover:bg-indigo-600 text-white font-bold px-8 py-2.5 rounded-xl shadow-sm border border-indigo-400/30 transition-all duration-300">
              <BookOpen className="w-5 h-5 mr-2" />
              {saving ? "Creating..." : "Create Course"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
