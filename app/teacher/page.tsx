import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { Card } from "@/components/ui/card"
import { Users, BookOpen, GraduationCap, ArrowUpRight, ShieldCheck, ArrowRight, BookPlus, TrendingUp, Eye, Plus } from "lucide-react"
import Link from "next/link"

export default async function TeacherDashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TEACHER")) {
    return null
  }

  const [totalStudents, totalCourses, activeEnrollments, pendingCertificates] = await Promise.all([
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.course.count(),
    prisma.enrollment.count({ where: { status: "ACTIVE" } }),
    prisma.certificate.count({ where: { status: "PENDING" } })
  ])

  const recentEnrollments = await prisma.enrollment.findMany({
    take: 5,
    orderBy: { enrolledAt: "desc" },
    include: { student: true, course: true }
  })

  const teacherCourses = await prisma.course.findMany({
    take: 6,
    include: {
      _count: { select: { lessons: true, enrollments: true } }
    },
    orderBy: { updatedAt: "desc" }
  })

  const stats = [
    { label: "Total Students", value: totalStudents, icon: Users, iconBg: "bg-[#e8eaf6]", iconColor: "text-[#1a237e]", trend: "+12%" },
    { label: "Active Courses", value: totalCourses, icon: BookOpen, iconBg: "bg-[#e8f5e9]", iconColor: "text-[#2e7d32]", trend: "+3%" },
    { label: "Active Enrollments", value: activeEnrollments, icon: GraduationCap, iconBg: "bg-[#ede7f6]", iconColor: "text-[#6a1b9a]", trend: "+8%" },
    { label: "Pending Certificates", value: pendingCertificates, icon: ShieldCheck, iconBg: "bg-[#fff3e0]", iconColor: "text-[#e65100]", trend: null },
  ]

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">Platform Overview</h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Monitor student progress and manage your courses.</p>
        </div>
        <Link href="/teacher/courses/new"
          className="inline-flex items-center gap-2 bg-[#1a237e] text-white px-4 py-2.5 rounded-lg text-sm font-semibold hover:bg-[#283593] transition-colors shadow-sm w-full sm:w-auto justify-center touch-target">
          <BookPlus className="w-4 h-4" />
          New Course
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, i) => (
          <Card key={i} className="p-4 sm:p-5 flex items-center gap-3 sm:gap-4 hover:shadow-md transition-shadow group">
            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${stat.iconBg} ${stat.iconColor} shrink-0 group-hover:scale-105 transition-transform duration-200`}>
              <stat.icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="text-xl sm:text-2xl font-black text-gray-900">{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-gray-500 font-medium truncate">{stat.label}</div>
              {stat.trend && (
                <div className="flex items-center gap-1 mt-0.5">
                  <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#2e7d32]" />
                  <span className="text-[10px] font-bold text-[#2e7d32]">{stat.trend}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Your Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-gray-900">Your Courses</h2>
            <p className="text-xs text-gray-500 mt-0.5">Quick preview and manage your recent courses.</p>
          </div>
          <Link href="/teacher/courses"
            className="text-xs font-semibold text-[#1a237e] hover:text-[#283593] transition-colors flex items-center gap-1">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {teacherCourses.map((course: any) => (
            <Card key={course.id} className="p-4 hover:shadow-md transition-shadow group border border-gray-200/80">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 truncate">{course.title}</h3>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    {course._count.modules} module{course._count.modules !== 1 ? "s" : ""} &middot; {course._count.enrollments} student{course._count.enrollments !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className={`shrink-0 ml-2 px-2 py-0.5 rounded-md text-[10px] font-bold border ${course.status === 'PUBLISHED' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                  {course.status}
                </span>
              </div>
              <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                <Link href={`/teacher/courses/${course.id}/preview`} target="_blank"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-[#1a237e] bg-[#e8eaf6] hover:bg-[#c5cae9] rounded-lg transition-colors">
                  <Eye className="w-3.5 h-3.5" /> Preview
                </Link>
                <Link href={`/teacher/courses/${course.id}`}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                  <BookOpen className="w-3.5 h-3.5" /> Edit
                </Link>
              </div>
            </Card>
          ))}
          {teacherCourses.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                <BookOpen className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-sm font-semibold text-gray-500 mb-1">No courses yet</p>
              <p className="text-xs text-gray-400 mb-4">Create your first course to get started.</p>
              <Link href="/teacher/courses/new"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1a237e] text-white text-xs font-bold rounded-lg hover:bg-[#283593] transition-colors">
                <Plus className="w-3.5 h-3.5" /> Create Course
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Recent Enrollments Table */}
        <div className="lg:col-span-2">
          <Card className="overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900">Recent Enrollments</h3>
              <button className="text-xs font-semibold text-[#1a237e] hover:text-[#283593] transition-colors">View All</button>
            </div>
            <div className="table-responsive-wrapper">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                    <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Course</th>
                    <th className="px-4 sm:px-6 py-3 text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 sm:px-6 py-3 text-right text-[10px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {recentEnrollments.map((enrollment: any) => (
                    <tr key={enrollment.id} className="hover:bg-gray-50 transition-colors group">
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-[#1a237e] flex items-center justify-center text-white text-[10px] sm:text-xs font-bold shrink-0">
                            {enrollment.student.name?.charAt(0)}
                          </div>
                          <span className="font-semibold text-gray-900 text-[11px] sm:text-xs truncate max-w-[120px] sm:max-w-none">{enrollment.student.name}</span>
                        </div>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-gray-600 text-[11px] sm:text-xs font-medium truncate max-w-[120px] sm:max-w-[200px]">{enrollment.course.title}</td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${enrollment.status === "COMPLETED"
                          ? "bg-[#e8f5e9] text-[#2e7d32]"
                          : "bg-[#e8eaf6] text-[#1a237e]"
                          }`}>
                          {enrollment.status}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-3 sm:py-4 text-right">
                        <button className="text-gray-400 hover:text-[#1a237e] text-[11px] sm:text-xs flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity font-semibold touch-target">
                          View <ArrowUpRight className="w-3 h-3" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {recentEnrollments.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 sm:px-6 py-8 sm:py-12 text-center text-sm text-gray-400">No recent enrollments.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-4">
          <Card className="p-4 sm:p-5">
            <h3 className="text-sm font-bold text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/teacher/courses/new"
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#1a237e]/30 hover:bg-[#f3f4fb] transition-all group touch-target">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#e8eaf6] text-[#1a237e] flex items-center justify-center shrink-0 group-hover:bg-[#1a237e] group-hover:text-white transition-colors">
                    <BookPlus className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">Create Course</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#1a237e] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>

              <Link href="/teacher/certificates"
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-all group touch-target">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#fff8e1] text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">Certificates</span>
                </div>
                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                  {pendingCertificates > 0 && (
                    <span className="px-1.5 sm:px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-[10px] font-black border border-red-200">
                      {pendingCertificates}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>

              <Link href="/teacher/students"
                className="flex items-center justify-between p-3 sm:p-4 rounded-lg bg-gray-50 border border-gray-200 hover:border-[#2e7d32]/30 hover:bg-[#f1f8f1] transition-all group touch-target">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-[#e8f5e9] text-[#2e7d32] flex items-center justify-center shrink-0 group-hover:bg-[#2e7d32] group-hover:text-white transition-colors">
                    <Users className="w-4 h-4" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 group-hover:text-gray-900 truncate">Student Tracking</span>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-[#2e7d32] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
