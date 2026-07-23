import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Plus, Edit, Eye, BookOpen, Users, BookPlus } from "lucide-react"
import Link from "next/link"
import { TeacherCourseActions } from "@/components/teacher/TeacherCourseActions"

export default async function TeacherCoursesPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return null
  }

  const courses = await prisma.course.findMany({
    include: {
      _count: {
        select: { lessons: true, enrollments: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="space-y-3 xs:space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-2 sm:mb-4">
        <div className="w-full sm:w-auto">
          <h1 className="text-base xs:text-lg sm:text-xl font-bold text-gray-900">Course Builder</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Manage your course catalog, modules, and lessons.</p>
        </div>
        <Link
          href="/teacher/courses/new"
          className="inline-flex items-center justify-center gap-2 bg-[#1a237e] text-white px-4 sm:px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#283593] transition-all duration-300 shadow-sm w-full sm:w-auto touch-target"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
          <span>New Course</span>
        </Link>
      </div>

      {/* ── Desktop Table (lg+) ── */}
      <Card className="hidden lg:block bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 font-bold tracking-wider">Title</th>
                <th className="px-6 py-4 font-bold tracking-wider">Status</th>
                <th className="px-6 py-4 font-bold tracking-wider">Lessons</th>
                <th className="px-6 py-4 font-bold tracking-wider">Students</th>
                <th className="px-6 py-4 text-right font-bold tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {courses.map((course: any) => (
                <tr key={course.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{course.title}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-md text-[11px] font-bold border ${course.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                      {course.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{course._count.lessons}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{course._count.enrollments}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/teacher/courses/${course.id}/preview`}
                        className="p-2 text-gray-400 hover:text-[#1a237e] hover:bg-[#e8eaf6] rounded-lg transition-colors"
                        title="Preview course"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/teacher/courses/${course.id}`}
                        className="p-2 text-gray-400 hover:text-[#1a237e] hover:bg-[#e8eaf6] rounded-lg transition-colors"
                        title="Edit course"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <TeacherCourseActions courseId={course.id} />
                    </div>
                  </td>
                </tr>
              ))}
              {courses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <BookPlus className="w-7 h-7 text-gray-400" />
                      </div>
                      <p className="text-sm">No courses found. Start by creating your first course.</p>
                      <Link
                        href="/teacher/courses/new"
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a237e] text-white text-xs font-bold rounded-lg hover:bg-[#283593] transition-colors mt-1"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create Course
                      </Link>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Mobile/Tablet Cards (below lg) ── */}
      <div className="lg:hidden space-y-3">
        {courses.map((course: any) => (
          <Card key={course.id} className="p-3 xs:p-4 sm:p-5 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2 xs:gap-3 mb-2 xs:mb-3">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 truncate">{course.title}</h3>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 shrink-0" />
                    {course._count.modules} module{course._count.modules !== 1 ? "s" : ""}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    {course._count.enrollments} student{course._count.enrollments !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
              <span className={`shrink-0 self-start px-2 py-0.5 xs:px-2.5 xs:py-1 rounded-md text-[10px] xs:text-[11px] font-bold border leading-normal ${course.status === 'PUBLISHED' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                {course.status}
              </span>
            </div>
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-1.5 xs:gap-2 pt-2 xs:pt-3 border-t border-gray-100">
              <Link
                href={`/teacher/courses/${course.id}/preview`}
                className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 xs:py-2 text-xs font-semibold text-[#1a237e] bg-[#e8eaf6] hover:bg-[#c5cae9] rounded-lg transition-colors touch-target"
              >
                <Eye className="w-3.5 h-3.5 shrink-0" /> Preview
              </Link>
              <Link
                href={`/teacher/courses/${course.id}`}
                className="flex items-center justify-center gap-1.5 flex-1 px-3 py-2.5 xs:py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors touch-target"
              >
                <Edit className="w-3.5 h-3.5 shrink-0" /> Edit
              </Link>
              <TeacherCourseActions courseId={course.id} />
            </div>
          </Card>
        ))}

        {courses.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 xs:py-14 text-center px-4">
            <div className="w-12 h-12 xs:w-14 xs:h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <BookPlus className="w-6 h-6 xs:w-7 xs:h-7 text-gray-400" />
            </div>
            <p className="text-sm font-semibold text-gray-500 mb-1">No courses yet</p>
            <p className="text-xs text-gray-400 mb-4 max-w-[240px]">Create your first course to get started.</p>
            <Link
              href="/teacher/courses/new"
              className="inline-flex items-center justify-center gap-1.5 w-full xs:w-auto px-5 py-2.5 xs:py-2.5 bg-[#1a237e] text-white text-sm font-bold rounded-lg hover:bg-[#283593] transition-colors touch-target"
            >
              <Plus className="w-4 h-4 shrink-0" /> Create Course
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
