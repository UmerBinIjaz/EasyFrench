import Link from "next/link"
import {
  ArrowRight, BookOpen, Globe2, Award, Users,
  Zap, TrendingUp, ClipboardCheck, ChevronRight, Star, GraduationCap,
  Flame, Sparkles, Headphones, PenLine, Languages, Clock, FileText, Target
} from "lucide-react"
import TestimonialsSlider from "@/components/landing/TestimonialsSlider"
import LandingNav from "@/components/landing/LandingNav"

interface Course {
  id: string
  title: string
  description: string
  imageUrl: string | null
  _count: { enrollments: number; modules: number }
}
interface Stats {
  students: number
  certificatesIssued: number
  publishedCourses: number
}
interface Testimonial {
  id: string
  name: string
  role: string
  text: string
  avatar: string | null
  rating: number
  color: string | null
}

interface LandingQuiz {
  id: string
  title: string
  description: string | null
  exam: string | null
  section: string | null
  level: string | null
  timeLimit: number | null
  passMark: number
  questionCount: number
}

async function getPublicData(): Promise<{ courses: Course[]; stats: Stats }> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/courses/public`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error("Failed")
    return res.json()
  } catch {
    return { courses: [], stats: { students: 0, certificatesIssued: 0, publishedCourses: 0 } }
  }
}

async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/testimonials`, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed")
    return res.json()
  } catch {
    return []
  }
}

async function getLandingQuizzes(): Promise<LandingQuiz[]> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
    const res = await fetch(`${baseUrl}/api/exam-prep/landing`, { next: { revalidate: 60 } })
    if (!res.ok) throw new Error("Failed")
    const data = await res.json()
    return Array.isArray(data) ? data : []
  } catch {
    return []
  }
}


const FEATURES = [
  { icon: BookOpen, title: "Structured Curriculum", desc: "Access comprehensive courses organized into modules and lessons with video and PDF materials.", color: "text-[#1a237e]", bg: "bg-[#e8eaf6]" },
  { icon: Flame, title: "Gamified Learning", desc: "Build daily learning streaks and earn XP points by completing lessons and passing quizzes.", color: "text-[#f9a825]", bg: "bg-[#fff8e1]" },
  { icon: TrendingUp, title: "Activity Tracking", desc: "Monitor your study time and module completion with detailed visual weekly charts.", color: "text-[#2e7d32]", bg: "bg-[#e8f5e9]" },
  { icon: Zap, title: "Interactive Quizzes", desc: "Test your knowledge with timed quizzes and varied question types for immediate feedback.", color: "text-[#6a1b9a]", bg: "bg-[#ede7f6]" },
  { icon: Sparkles, title: "Word of the Day", desc: "Expand your vocabulary daily with curated words, complete with translations and examples.", color: "text-[#00695c]", bg: "bg-[#e0f2f1]" },
  { icon: Award, title: "Certificates", desc: "Earn verifiable digital certificates upon successfully completing your courses.", color: "text-[#c62828]", bg: "bg-[#ffebee]" },
]

export default async function LandingPage() {
  const [{ courses, stats }, testimonials, landingQuizzes] = await Promise.all([
    getPublicData(),
    getTestimonials(),
    getLandingQuizzes(),
  ])
  const displayedTestimonials = testimonials
  const studentCount = stats.students > 0 ? `${stats.students.toLocaleString()}+` : "15K+"
  const courseCount = stats.publishedCourses > 0 ? `${stats.publishedCourses}` : "48"

  // ── Group real backend quizzes by exam (TCF / TEF / …) ──
  const EXAM_ACCENT: Record<string, { badge: string; chip: string; icon: string }> = {
    TCF: { badge: "bg-[#e8eaf6] text-[#1a237e] border-[#c5cae9]", chip: "bg-[#1a237e] text-white", icon: "🇨🇦" },
    TEF: { badge: "bg-[#e8f5e9] text-[#2e7d32] border-[#c8e6c9]", chip: "bg-[#2e7d32] text-white", icon: "🇫🇷" },
  }
  const defaultAccent = { badge: "bg-gray-100 text-gray-700 border-gray-200", chip: "bg-gray-800 text-white", icon: "📝" }

  const exams = Array.from(new Set(landingQuizzes.map((q) => q.exam || "General")))
  const quizzesByExam = exams
    .map((exam) => ({
      exam,
      quizzes: landingQuizzes.filter((q) => (q.exam || "General") === exam),
    }))
    .sort((a, b) => a.exam.localeCompare(b.exam))

  // Pick an icon for a quiz based on its section
  function sectionIcon(section: string | null) {
    if (!section) return FileText
    const s = section.toLowerCase()
    if (s.includes("orale") && s.includes("compr")) return Headphones
    if (s.includes("écrite") && s.includes("compr")) return BookOpen
    if (s.includes("expression") && s.includes("orale")) return Languages
    if (s.includes("expression") && s.includes("écrite")) return PenLine
    if (s.includes("lexique") || s.includes("structure")) return Languages
    return FileText
  }

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden">

      {/* ── HEADER ── */}
      <LandingNav />

      {/* ── HERO ── */}
      <section className="bg-[#f8faff] pt-10 sm:pt-14 md:pt-20 pb-0 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-12 items-center">
          {/* Text */}
          <div className="text-center md:text-left pb-10 md:pb-20">
            <div className="inline-flex items-center gap-2 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold px-4 py-1.5 rounded-full mb-5 border border-[#c8e6c9]">
              <span className="w-1.5 h-1.5 bg-[#2e7d32] rounded-full animate-pulse" />
              MASTER FRENCH ANYWHERE
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1a237e] leading-[1.1] tracking-tight mb-4">
              EasyFrench — Learn<br />Without Limits
            </h1>
            <p className="text-sm sm:text-base text-gray-500 leading-relaxed mb-8 max-w-md mx-auto md:mx-0">
              The premium platform for TCF/TEF preparation and real-world academic French fluency. Discover high-performance courses designed for the modern student.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <Link href="/exam-prep" className="inline-flex items-center justify-center gap-2 bg-[#1a237e] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#283593] transition-colors no-underline shadow-md shadow-[#1a237e]/20">
                Free TCF/TEF Mock Tests
              </Link>
              <Link href="/login" className="inline-flex items-center justify-center gap-2 bg-white text-[#1a237e] px-6 py-3 rounded-xl font-semibold text-sm border border-[#c5cae9] hover:bg-[#f3f4fb] transition-colors no-underline">
                Explore Curriculum
              </Link>
            </div>
          </div>

          {/* Image */}
          <div className="relative hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=700&q=85"
              alt="Student learning online"
              className="w-full rounded-t-2xl object-cover max-h-[380px]"
            />
            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 bg-white rounded-xl px-4 py-3 shadow-xl flex items-center gap-3">
              <div className="w-9 h-9 bg-[#e8f5e9] rounded-lg flex items-center justify-center shrink-0">
                <Star className="w-4 h-4 text-[#2e7d32] fill-[#2e7d32]" />
              </div>
              <div>
                <div className="font-bold text-sm text-[#1a237e]">4.9 / 5 Rating</div>
                <div className="text-xs text-gray-400">From {studentCount} Students</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STAT BAR ── */}
      <section className="bg-[#1a237e] py-6 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-8 sm:gap-16">
          {[
            { value: studentCount, label: "Active Students" },
            { value: courseCount, label: "Specialized Courses" },
            { value: "95%", label: "Completion Rate" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <div className="text-2xl sm:text-3xl font-black text-white">{value}</div>
              <div className="text-xs text-[#9fa8da] mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── COURSE CATALOG ── */}
      <section id="courses" className="py-12 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900">All Courses</h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mb-8">Browse our complete catalog of courses and start learning today.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.length > 0 ? courses.map((c: any) => (
              <Link
                key={c.id}
                href={`/courses/${c.id}`}
                className="group flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 no-underline"
              >
                <div className="relative aspect-video overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={c.imageUrl || "https://images.unsplash.com/photo-1543269865-cbf427effbad?w=600&q=80"}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="inline-block bg-[#e8eaf6] text-[#1a237e] text-[10px] font-bold px-2.5 py-0.5 rounded-full mb-3 w-fit">FREE</div>
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-2 group-hover:text-[#1a237e] transition-colors">{c.title}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-2">{c.description}</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400 pt-3 border-t border-gray-100">
                    <BookOpen className="w-3 h-3" />
                    <span>{c._count?.lessons ?? 0} Lessons</span>
                    <span>·</span>
                    <Users className="w-3 h-3" />
                    <span>{(c._count?.enrollments ?? 0).toLocaleString()}+ enrolled</span>
                  </div>
                </div>
              </Link>
            )) : (
              <div className="col-span-full text-center py-16 text-gray-400 text-sm">
                No courses available yet. Check back later!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── GUEST MOCK TESTS ── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 bg-[#f8faff]">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-5 mb-8 sm:mb-10">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#e8f5e9] text-[#2e7d32] text-xs font-bold px-4 py-1.5 rounded-full mb-4 border border-[#c8e6c9]">
                <ClipboardCheck className="w-3.5 h-3.5" /> Guest Mock Tests
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 leading-tight mb-3">
                Free TCF & TEF Mock Tests
              </h2>
              <p className="text-sm sm:text-base text-gray-500 leading-relaxed max-w-xl">
                Practice real, teacher-created exam-prep quizzes — comprehension, expression, grammar and more — with instant scoring and answer review. No account required.
              </p>
            </div>
            <Link href="/exam-prep" className="inline-flex items-center gap-2 bg-[#1a237e] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#283593] transition-colors no-underline shrink-0">
              All Mock Tests <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {landingQuizzes.length > 0 ? (
            /* Real quizzes grouped by exam */
            <div className="space-y-8">
              {quizzesByExam.map(({ exam, quizzes }) => {
                const accent = EXAM_ACCENT[exam] ?? defaultAccent
                return (
                  <div key={exam}>
                    {/* Exam header */}
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full border ${accent.badge}`}>
                        <span>{accent.icon}</span> {exam}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">
                        {quizzes.length} practice set{quizzes.length !== 1 ? "s" : ""}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Quiz cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {quizzes.map((q) => {
                        const Icon = sectionIcon(q.section)
                        return (
                          <Link
                            key={q.id}
                            href="/exam-prep"
                            className="flex flex-col bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-lg hover:border-gray-300 hover:-translate-y-0.5 transition-all no-underline group"
                          >
                            <div className="flex items-start justify-between gap-3 mb-3">
                              <div className="w-10 h-10 bg-[#e8eaf6] rounded-xl flex items-center justify-center shrink-0">
                                <Icon className="w-5 h-5 text-[#1a237e]" />
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 justify-end">
                                {q.level && (
                                  <span className="text-[10px] font-bold text-[#1a237e] bg-[#e8eaf6] px-2 py-0.5 rounded-full">
                                    {q.level}
                                  </span>
                                )}
                                {q.section && (
                                  <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full max-w-[120px] truncate">
                                    {q.section}
                                  </span>
                                )}
                              </div>
                            </div>

                            <h3 className="font-bold text-sm text-gray-900 mb-1.5 group-hover:text-[#1a237e] transition-colors leading-snug line-clamp-2">
                              {q.title}
                            </h3>
                            <p className="text-xs text-gray-500 leading-relaxed mb-4 flex-1 line-clamp-2">
                              {q.description || "Teacher-created exam-prep practice set."}
                            </p>

                            <div className="flex items-center gap-3 text-[11px] text-gray-400 font-semibold pt-3 border-t border-gray-100">
                              <span className="inline-flex items-center gap-1">
                                <ClipboardCheck className="w-3 h-3" /> {q.questionCount} Q
                              </span>
                              {q.timeLimit ? (
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> {q.timeLimit} min
                                </span>
                              ) : null}
                              <span className="inline-flex items-center gap-1">
                                <Target className="w-3 h-3" /> Pass {q.passMark}%
                              </span>
                              <ChevronRight className="w-3.5 h-3.5 ml-auto text-gray-300 group-hover:text-[#1a237e] transition-colors" />
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400 text-sm">
              No mock tests available yet. Check back later!
            </div>
          )}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-12 sm:py-16 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10 sm:mb-14">
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 mb-3">Everything You Need to Succeed</h2>
            <p className="text-sm text-gray-400 max-w-md mx-auto">Our platform gives you the fastest path to French fluency and exam readiness.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="p-5 sm:p-6 rounded-2xl border border-gray-200 bg-white hover:shadow-md hover:border-gray-300 transition-all">
                <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm sm:text-base mb-2">{title}</h3>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-12 sm:py-16 px-4 sm:px-6 bg-[#1a237e]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-xl sm:text-2xl font-black text-white mb-3">Real Results, Real People</h2>
            <p className="text-sm text-[#9fa8da]">Thousands of students have transformed their French with EasyFrench.</p>
          </div>
          <TestimonialsSlider testimonials={displayedTestimonials} />
        </div>
      </section>



      {/* ── FOOTER ── */}
      <footer className="bg-[#f8faff] border-t border-gray-200 py-10 sm:py-14 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
            {/* Brand */}
            <div className="col-span-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 bg-[#1a237e] rounded-lg flex items-center justify-center shrink-0">
                  <GraduationCap className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-extrabold text-[#1a237e]">EasyFrench</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed max-w-[220px]">
                High-performance learning management designed for professional academic environments.
              </p>
            </div>

            {/* Courses */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Courses</h4>
              <ul className="space-y-2.5 text-xs text-gray-500">
                {courses.slice(0, 4).map((c) => (
                  <li key={c.id}>
                    <Link href={`/courses/${c.id}`} className="hover:text-gray-800 transition-colors no-underline">
                      {c.title}
                    </Link>
                  </li>
                ))}
                {courses.length === 0 && (
                  <>
                    {["A1 Beginner", "A2 Elementary", "B1 Intermediate", "B2 Advanced"].map((c) => (
                      <li key={c}><a href="/register" className="hover:text-gray-800 transition-colors no-underline">{c}</a></li>
                    ))}
                  </>
                )}
              </ul>
            </div>



            {/* Contact */}
            <div>
              <h4 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-4">Contact Us</h4>
              <ul className="space-y-2.5 text-xs text-gray-500">
                <li><a href="mailto:contact@easyfrench.ca" className="hover:text-gray-800 transition-colors no-underline">contact@easyfrench.ca</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} EasyFrench. All rights reserved.</p>
            <p className="text-xs text-gray-400">High-Performance Learning by EasyFrench Academy</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
