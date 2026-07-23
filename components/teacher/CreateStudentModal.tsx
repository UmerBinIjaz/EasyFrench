"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, UserPlus } from "lucide-react"

interface Course {
    id: string
    title: string
}

interface CreateStudentModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function CreateStudentModal({ isOpen, onClose, onSuccess }: CreateStudentModalProps) {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [courseId, setCourseId] = useState("")
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingCourses, setLoadingCourses] = useState(false)
    const [error, setError] = useState("")

    // Fetch available courses when modal opens
    useEffect(() => {
        if (isOpen) {
            setLoadingCourses(true)
            fetch("/api/courses")
                .then((res) => res.json())
                .then((data) => {
                    setCourses(data || [])
                })
                .catch(() => setError("Failed to load courses"))
                .finally(() => setLoadingCourses(false))
        }
    }, [isOpen])

    const resetForm = () => {
        setName("")
        setEmail("")
        setPassword("")
        setCourseId("")
        setError("")
    }

    const handleClose = () => {
        resetForm()
        onClose()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (!name.trim() || !email.trim() || !password.trim()) {
            setError("All fields are required")
            return
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters long")
            return
        }

        setLoading(true)

        try {
            const res = await fetch("/api/students", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: name.trim(),
                    email: email.trim(),
                    password,
                    courseId: courseId || undefined,
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || "Failed to create student")
                return
            }

            resetForm()
            onSuccess()
        } catch {
            setError("Something went wrong. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Create New Student">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
                        {error}
                    </div>
                )}

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Full Name</label>
                    <Input
                        type="text"
                        placeholder="e.g. John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Email Address</label>
                    <Input
                        type="email"
                        placeholder="e.g. john@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                    />
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Temporary Password</label>
                    <Input
                        type="password"
                        placeholder="Min. 6 characters"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        The student can change this after logging in.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-gray-700">Enroll in Course (optional)</label>
                    {loadingCourses ? (
                        <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Loading courses...
                        </div>
                    ) : (
                        <select
                            value={courseId}
                            onChange={(e) => setCourseId(e.target.value)}
                            disabled={loading}
                            className="flex h-10 sm:h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base text-gray-900 placeholder:text-gray-400 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a237e]/30 focus-visible:border-[#1a237e] disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            <option value="">— No course enrollment —</option>
                            {courses.map((course) => (
                                <option key={course.id} value={course.id}>
                                    {course.title}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="primary"
                        disabled={loading}
                        className="min-w-[140px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Creating...
                            </>
                        ) : (
                            <>
                                <UserPlus className="w-4 h-4 mr-2" />
                                Create Student
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}