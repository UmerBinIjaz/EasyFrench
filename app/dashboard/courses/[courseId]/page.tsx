"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useSession } from "next-auth/react"
import { LessonItem } from "@/components/course/LessonItem"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ProgressBar } from "@/components/ui/progress-bar"
import { useToast } from "@/components/providers/ToastProvider"
import {
  isLessonFullySatisfied,
  isLessonLocked,
  getLessonContentInfo,
  buildSubmittedExerciseLessonIds,
  buildPassedQuizLessonIds,
} from "@/lib/progression"

export default function CourseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const { showToast } = useToast()

  const searchParams = useSearchParams()
  const viewParam = searchParams.get('view')

  const [course, setCourse] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [progressData, setProgressData] = useState<any[]>([])
  const [quizResults, setQuizResults] = useState<any[]>([])
  const [exerciseSubmissions, setExerciseSubmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'curriculum' | 'quizzes'>(viewParam === 'quizzes' ? 'quizzes' : 'curriculum')


  useEffect(() => {
    async function fetchData() {
      if (!session) return

      try {
        const [courseRes, enrollRes, progressRes, quizRes, exerciseRes] = await Promise.all([
          fetch(`/api/courses/${params.courseId}`),
          fetch(`/api/enrollments?studentId=${session.user.id}`),
          fetch(`/api/progress`),
          fetch(`/api/quiz-results`),
          fetch(`/api/exercises/student`)
        ])

        const courseData = await courseRes.json()
        const enrollmentsData = await enrollRes.json()
        const progressD = await progressRes.json()
        const quizD = await quizRes.json()
        const exerciseD = await exerciseRes.json()

        setCourse(courseData)
        setEnrollment(enrollmentsData.find((e: any) => e.courseId === params.courseId))
        setProgressData(progressD)
        setQuizResults(quizD)
        setExerciseSubmissions(Array.isArray(exerciseD) ? exerciseD : (exerciseD?.submissions || []))
      } catch (error) {
        console.error("Error loading course details", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [params.courseId, session])

  const handleEnroll = async () => {
    try {
      const res = await fetch(`/api/enrollments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId: params.courseId })
      })
      if (res.ok) {
        const newEnrollment = await res.json()
        setEnrollment(newEnrollment)
        showToast("Successfully enrolled in the course!", "success")
      } else {
        const data = await res.json()
        showToast(data.error || "Failed to enroll.")
      }
    } catch (error) {
      showToast("Error enrolling. Please try again.")
    }
  }

  if (loading) return <div>Loading...</div>
  if (!course) return <div>Course not found</div>

  const allLessons = course.lessons || []
  const totalLessons = allLessons.length
  const totalQuizzes = (course.quizzes?.length || 0) + allLessons.reduce((a: number, l: any) => a + (l.quizzes?.length || 0), 0)

  // Build progression maps for all lessons
  const passedQuizIds = new Set(quizResults.filter((r: any) => r.passed).map((r: any) => r.quizId))
  const submittedExerciseIds = new Set(exerciseSubmissions.map((s: any) => s.exerciseId))

  const lessonExerciseMap = new Map<string, string>()
  const lessonQuizMap = new Map<string, string>()
  allLessons.forEach((l: any) => {
    const ex = l.exercises?.[0]
    if (ex) lessonExerciseMap.set(l.id, ex.id)
    const q = l.quizzes?.find((q: any) => q.type === "QUIZ" || !q.type)
    if (q) lessonQuizMap.set(l.id, q.id)
  })

  const submittedExerciseLessonIds = buildSubmittedExerciseLessonIds(lessonExerciseMap, submittedExerciseIds)
  const passedQuizLessonIds = buildPassedQuizLessonIds(lessonQuizMap, passedQuizIds)

  const completedLessonIds = new Set(progressData.filter((p: any) => p.completed).map((p: any) => p.lessonId))

  // A lesson is counted as "complete" for progress if it is fully satisfied
  const fullySatisfiedLessonIds = new Set(
    allLessons
      .filter((l: any) => isLessonFullySatisfied(
        l,
        completedLessonIds.has(l.id),
        submittedExerciseLessonIds.has(l.id),
        passedQuizLessonIds.has(l.id),
      ))
      .map((l: any) => l.id)
  )

  const completedItemsCount = fullySatisfiedLessonIds.size
  const totalItemsCount = allLessons.length
  const progressPercent = totalItemsCount === 0 ? 0 : Math.round((completedItemsCount / totalItemsCount) * 100)

  // Find first lesson that is not fully satisfied (for "Continue Learning")
  const firstNotSatisfiedIdx = allLessons.findIndex(
    (l: any) => !isLessonFullySatisfied(
      l,
      completedLessonIds.has(l.id),
      submittedExerciseLessonIds.has(l.id),
      passedQuizLessonIds.has(l.id),
    )
  )
  const firstNotSatisfiedLesson = firstNotSatisfiedIdx >= 0 ? allLessons[firstNotSatisfiedIdx] : null

  return (
    <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
      {/* Main Content */}
      <div className="flex-1 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">{course.title}</h1>
          <p className="text-sm sm:text-base text-gray-400 leading-relaxed">{course.description}</p>
        </div>

        <div className="space-y-4 sm:space-y-6">
          <div className="flex items-center gap-4 sm:gap-6 border-b border-gray-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('curriculum')}
              className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors touch-target ${activeTab === 'curriculum' ? 'text-[#1a237e] border-b-2 border-[#1a237e]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Course Curriculum
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`pb-3 text-xs sm:text-sm font-bold whitespace-nowrap transition-colors touch-target ${activeTab === 'quizzes' ? 'text-[#1a237e] border-b-2 border-[#1a237e]' : 'text-gray-500 hover:text-gray-800'}`}
            >
              Quizzes & Assessments
            </button>
          </div>

          {activeTab === 'curriculum' && (
            <div className="space-y-4">

              <Card className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                  <div className="space-y-1 py-2">
                    {allLessons.map((lesson: any, lessonIdx: number) => {
                      const isCompleted = progressData.some(p => p.lessonId === lesson.id && p.completed)

                      // Use progression-based lock: lesson is locked if previous lesson is not fully satisfied
                      const locked = !enrollment
                        ? !(lessonIdx === 0)
                        : isLessonLocked(allLessons, lesson.id, completedLessonIds, submittedExerciseLessonIds, passedQuizLessonIds)

                      return (
                        <div key={lesson.id} className="space-y-1">
                          <LessonItem
                            lesson={lesson}
                            courseId={course.id}
                            isCompleted={isCompleted}
                            isLocked={locked}
                          />
                          {lesson.quizzes?.map((quiz: any) => {
                            const isQuizCompleted = quizResults.some(r => r.quizId === quiz.id && r.passed)
                            const isQuizLocked = locked || isQuizCompleted

                            return (
                              <div key={quiz.id} className={`pl-14 pr-4 py-2.5 flex items-center justify-between text-sm ${isQuizLocked ? 'opacity-50 grayscale' : 'hover:bg-white/5 rounded-lg my-0.5'}`}>
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${isQuizCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                                    {isQuizCompleted && <svg className="w-2.5 h-2.5 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                  </div>
                                  <span className="font-medium text-purple-400">{quiz.title} <span className="text-[10px] uppercase text-purple-500">({quiz.type})</span></span>
                                </div>
                                {!isQuizLocked && (
                                  <Button size="sm" variant="outline" className="h-7 text-xs border-white/10 hover:bg-white/10 text-gray-900" onClick={() => router.push(`/dashboard/quizzes/${quiz.id}?lessonId=${lesson.id}`)}>
                                    {isQuizCompleted ? 'Retake' : 'Start'}
                                  </Button>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
              </Card>

              {course.quizzes?.length > 0 && (
                <div className="mt-6 sm:mt-8 space-y-3">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">Final Course Assessments</h3>
                  {course.quizzes.map((quiz: any) => {
                    const isQuizCompleted = quizResults.some(r => r.quizId === quiz.id && r.passed)
                    const allLessonsSatisfied = allLessons.length > 0 && allLessons.every((l: any) => fullySatisfiedLessonIds.has(l.id))
                    const isQuizLocked = !enrollment || !allLessonsSatisfied

                    return (
                      <Card key={quiz.id} className={`p-5 flex items-center justify-between ${isQuizLocked ? 'opacity-50 grayscale' : 'border-indigo-500/20 bg-indigo-950/20 hover:border-indigo-500/30'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isQuizCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}>
                            {isQuizCompleted && <svg className="w-3 h-3 text-gray-900" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div>
                            <span className="font-bold text-indigo-300 text-lg">{quiz.title}</span>
                            <p className="text-xs text-indigo-400 uppercase tracking-wider">{quiz.type}</p>
                          </div>
                        </div>
                        {!isQuizLocked && (
                          <Button onClick={() => router.push(`/dashboard/quizzes/${quiz.id}`)} className="bg-gradient-to-r from-blue-600 to-violet-600 text-gray-900 border-0">
                            {isQuizCompleted ? 'Review' : 'Take Assessment'}
                          </Button>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'quizzes' && (
            <div className="space-y-6">
                <div className="space-y-3">
                    <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Lesson Assessments</h4>
                    {allLessons.map((lesson: any) => (
                        lesson.quizzes?.map((quiz: any) => {
                            const isQuizCompleted = quizResults.some(r => r.quizId === quiz.id && r.passed)
                            // A lesson quiz is locked if the lesson itself is locked
                            const locked = !enrollment || isLessonLocked(allLessons, lesson.id, completedLessonIds, submittedExerciseLessonIds, passedQuizLessonIds)

                            return (
                                <div key={quiz.id} className={`p-4 bg-white border border-gray-200 rounded-xl flex items-center justify-between text-sm ${locked ? 'opacity-50 grayscale' : 'hover:border-[#1a237e]/30 shadow-sm'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isQuizCompleted ? 'bg-emerald-50 border-emerald-500' : 'border-gray-300'}`}>
                                            {isQuizCompleted && <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                        </div>
                                        <div>
                                            <span className="font-bold text-gray-900 text-base">{quiz.title}</span>
                                            <p className="text-xs text-gray-500 mt-0.5 uppercase">{quiz.type} &bull; Lesson: {lesson.title}</p>
                                        </div>
                                    </div>
                                    {!locked && (
                                        <Button size="sm" className="bg-[#1a237e] hover:bg-[#283593] text-white" onClick={() => router.push(`/dashboard/quizzes/${quiz.id}`)}>
                                            {isQuizCompleted ? 'Retake' : 'Start Assessment'}
                                        </Button>
                                    )}
                                </div>
                            )
                        })
                    ))}
                </div>

              {course.quizzes?.length > 0 && (
                <div className="space-y-3 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-bold text-gray-600 uppercase tracking-wider">Final Course Assessments</h4>
                  {course.quizzes.map((quiz: any) => {
                    const isQuizCompleted = quizResults.some(r => r.quizId === quiz.id && r.passed)
                    const allLessonsSatisfied = allLessons.length > 0 && allLessons.every((l: any) => fullySatisfiedLessonIds.has(l.id))
                    const isQuizLocked = !enrollment || !allLessonsSatisfied

                    return (
                      <Card key={quiz.id} className={`p-5 flex items-center justify-between ${isQuizLocked ? 'opacity-50 grayscale' : 'border-[#1a237e]/20 bg-[#f3f4fb] hover:border-[#1a237e]/40 shadow-sm'}`}>
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${isQuizCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-gray-400'}`}>
                            {isQuizCompleted && <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                          </div>
                          <div>
                            <span className="font-bold text-[#1a237e] text-lg">{quiz.title}</span>
                            <p className="text-xs text-[#3949ab] uppercase tracking-wider mt-0.5">{quiz.type}</p>
                          </div>
                        </div>
                        {!isQuizLocked && (
                          <Button onClick={() => router.push(`/dashboard/quizzes/${quiz.id}`)} className="bg-[#2e7d32] hover:bg-[#388e3c] text-white font-bold px-6">
                            {isQuizCompleted ? 'Review' : 'Take Assessment'}
                          </Button>
                        )}
                      </Card>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sidebar Info */}
      <div className="w-full lg:w-80 shrink-0">
        <Card className="p-4 sm:p-6 sticky top-24">
          <div className="space-y-4 mb-8">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Lessons</span>
              <span className="font-semibold text-gray-900">{totalLessons}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Quizzes & Exercises</span>
              <span className="font-semibold text-gray-900">{totalQuizzes}</span>
            </div>
          </div>

          {!enrollment ? (
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-gray-900" onClick={handleEnroll}>
              Enroll in this Course
            </Button>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm font-semibold mb-2">
                  <span className="text-gray-400">Your Progress</span>
                  <span className="text-blue-400">{progressPercent}%</span>
                </div>
                <ProgressBar value={progressPercent} />
              </div>

              {progressPercent === 100 ? (
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-gray-900" onClick={() => router.push('/dashboard/certificates')}>
                  View My Certificate
                </Button>
              ) : (
                <Button className="w-full bg-gradient-to-r from-blue-600 to-violet-600 border-0 text-white" onClick={() => {
                  if (firstNotSatisfiedLesson) {
                    const info = getLessonContentInfo(firstNotSatisfiedLesson)
                    const isCompleted = completedLessonIds.has(firstNotSatisfiedLesson.id)
                    const isExerciseSubmitted = submittedExerciseLessonIds.has(firstNotSatisfiedLesson.id)

                    if (!isCompleted) {
                      router.push(`/dashboard/lessons/${firstNotSatisfiedLesson.id}`)
                    } else if (info.hasExercise && !isExerciseSubmitted) {
                      router.push(`/dashboard/exercises/${info.exerciseId}`)
                    } else if (info.hasQuiz) {
                      router.push(`/dashboard/quizzes/${info.quizId}?lessonId=${firstNotSatisfiedLesson.id}`)
                    } else {
                      router.push(`/dashboard/lessons/${firstNotSatisfiedLesson.id}`)
                    }
                  }
                }}>
                  Continue Learning
                </Button>
              )}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
