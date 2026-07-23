"use client"

import { useEffect, useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateStudentModal } from "@/components/teacher/CreateStudentModal"
import { Modal } from "@/components/ui/modal"
import { Search, UserPlus, BookOpen, Loader2, GraduationCap } from "lucide-react"

interface Course {
  id: string
  title: string
}

interface Enrollment {
  id: string
  course: { id: string; title: string }
}

interface Student {
  id: string
  name: string
  email: string
  createdAt: string
  enrollments: Enrollment[]
  progress: { completed: boolean }[]
  quizResults: { score: number }[]
}

export default function TeacherStudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [enrollingStudentId, setEnrollingStudentId] = useState<string | null>(null)
  const [selectedCourseId, setSelectedCourseId] = useState("")
  const [enrolling, setEnrolling] = useState(false)
  const [enrollError, setEnrollError] = useState("")

  const fetchData = async () => {
    try {
      const [studentsRes, coursesRes] = await Promise.all([
        fetch("/api/students"),
        fetch("/api/courses"),
      ])
      const studentsData = await studentsRes.json()
      const coursesData = await coursesRes.json()
      setStudents(studentsData || [])
      setCourses(coursesData || [])
    } catch (err) {
      console.error("Failed to fetch data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filteredStudents = students.filter((student) => {
    const query = searchQuery.toLowerCase()
    return (
      student.name.toLowerCase().includes(query) ||
      student.email.toLowerCase().includes(query)
    )
  })

  const handleEnroll = async () => {
    if (!enrollingStudentId || !selectedCourseId) return
    setEnrolling(true)
    setEnrollError("")

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: enrollingStudentId,
          courseId: selectedCourseId,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setEnrollError(data.error || "Failed to enroll student")
        return
      }

      // Refresh data
      await fetchData()
      setEnrollingStudentId(null)
      setSelectedCourseId("")
      setEnrollError("")
    } catch {
      setEnrollError("Something went wrong. Please try again.")
    } finally {
      setEnrolling(false)
    }
  }

  const getStudent = (id: string) => students.find((s) => s.id === id)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-2">Student Tracking</h1>
          <p className="text-gray-600 font-medium">Monitor student progress, engagement, and performance.</p>
        </div>
        <Button
          variant="primary"
          onClick={() => setShowCreateModal(true)}
          className="shrink-0"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Add Student
        </Button>
      </div>

      {/* Search */}
      <Card className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search students by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/20 focus:border-[#1a237e] transition-all"
            />
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-8 py-5 font-bold tracking-wider">Student</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Enrolled Courses</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Completed Lessons</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Avg Quiz Score</th>
                  <th className="px-8 py-5 font-bold tracking-wider">Joined</th>
                  <th className="px-8 py-5 font-bold tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredStudents.map((student) => {
                  const completedLessons = student.progress.filter((p) => p.completed).length
                  const quizScores = student.quizResults.map((q) => q.score)
                  const avgScore = quizScores.length > 0
                    ? Math.round(quizScores.reduce((a, b) => a + b, 0) / quizScores.length)
                    : 0

                  return (
                    <tr key={student.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-gray-900 mb-0.5">{student.name}</div>
                        <div className="text-xs text-gray-500 font-medium">{student.email}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1.5 max-w-[220px]">
                          {student.enrollments.length > 0 ? (
                            student.enrollments.slice(0, 2).map((enr) => (
                              <span
                                key={enr.id}
                                className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-md text-[11px] font-semibold border border-indigo-200"
                              >
                                <BookOpen className="w-3 h-3" />
                                {enr.course.title}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-400 text-xs font-medium">Not enrolled</span>
                          )}
                          {student.enrollments.length > 2 && (
                            <span className="text-xs text-gray-400 font-medium">
                              +{student.enrollments.length - 2} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-gray-700 font-medium">
                        <span className="bg-gray-100 px-3 py-1 rounded-lg border border-gray-200 text-xs">
                          {completedLessons}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        {avgScore > 0 ? (
                          <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${avgScore >= 80
                              ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                              : avgScore >= 60
                                ? "bg-amber-50 text-amber-600 border-amber-200"
                                : "bg-rose-50 text-rose-600 border-rose-200"
                              }`}
                          >
                            {avgScore}%
                          </span>
                        ) : (
                          <span className="text-gray-400 font-medium px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                            N/A
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-5 text-gray-500 font-medium text-xs">
                        {new Date(student.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-5 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEnrollingStudentId(student.id)}
                        >
                          <BookOpen className="w-3.5 h-3.5 mr-1.5" />
                          Enroll
                        </Button>
                      </td>
                    </tr>
                  )
                })}
                {filteredStudents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-8 py-16 text-center text-gray-400 font-medium">
                      {searchQuery ? "No students match your search." : "No students found. Click \"Add Student\" to create one."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Create Student Modal */}
      <CreateStudentModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false)
          fetchData()
        }}
      />

      {/* Enroll in Course Modal */}
      <Modal
        isOpen={!!enrollingStudentId}
        onClose={() => {
          setEnrollingStudentId(null)
          setSelectedCourseId("")
          setEnrollError("")
        }}
        title="Enroll Student in Course"
      >
        {enrollingStudentId && (() => {
          const student = getStudent(enrollingStudentId)
          return (
            <div className="space-y-4">
              {student && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="w-9 h-9 rounded-full bg-[#1a237e] flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-gray-900">{student.name}</div>
                    <div className="text-xs text-gray-500">{student.email}</div>
                  </div>
                </div>
              )}

              {enrollError && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-600 font-medium">
                  {enrollError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Select Course</label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="flex h-10 sm:h-11 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm sm:text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1a237e]/30 focus:border-[#1a237e]"
                >
                  <option value="">— Choose a course —</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEnrollingStudentId(null)
                    setSelectedCourseId("")
                    setEnrollError("")
                  }}
                  disabled={enrolling}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleEnroll}
                  disabled={enrolling || !selectedCourseId}
                  className="min-w-[140px]"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Enrolling...
                    </>
                  ) : (
                    <>
                      <GraduationCap className="w-4 h-4 mr-2" />
                      Enroll Now
                    </>
                  )}
                </Button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}
