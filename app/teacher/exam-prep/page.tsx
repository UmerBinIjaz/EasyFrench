"use client"

import { useEffect, useState, Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, Save, X, ChevronDown, ChevronRight, Edit2, Trash2, Headphones, BookOpen, Languages, PenTool, Mic, Info, Clock, Users, MessageSquare } from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"
import { QuestionForm, emptyQuestion, examSections, cefrLevels, sectionQuestionTypes } from "./components/QuestionForm"
import type { Question, QuestionType } from "./components/QuestionForm"

// ─── Expression Orale Info Panel ────────────────────────────────────────────
function ExpressionOraleInfoPanel() {
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 overflow-hidden shadow-sm">
      {/* Header row */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/40 transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-violet-600 text-white flex items-center justify-center shadow-sm">
            <Mic className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="text-sm font-black text-violet-900">Expression Orale — Exam Guide</p>
            <p className="text-[11px] text-violet-500 font-medium">Speaking exam overview for TCF &amp; TEF · click to {open ? "collapse" : "expand"}</p>
          </div>
        </div>
        <div className={`w-7 h-7 rounded-lg bg-violet-100 text-violet-600 flex items-center justify-center transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {open && (
        <div className="px-5 pb-6 space-y-6 border-t border-violet-100">

          {/* What is it? */}
          <div className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-violet-500" />
              <h3 className="font-black text-gray-900 text-sm">What is Expression Orale?</h3>
            </div>
            <div className="bg-white/70 rounded-xl border border-violet-100 p-4 space-y-2 text-sm text-gray-700">
              <p>TCF / TEF Expression Orale is a <strong>speaking exam</strong>, not a written exam.</p>
              <ul className="space-y-1 text-[13px] text-gray-600 list-none pl-0">
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">▸</span>You speak directly with an examiner.</li>
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">▸</span>The conversation is recorded.</li>
                <li className="flex items-start gap-2"><span className="text-violet-400 mt-0.5">▸</span>Students answer questions and participate in speaking activities.</li>
              </ul>
            </div>
          </div>

          {/* Two-column: TCF + TEF */}
          <div className="grid md:grid-cols-2 gap-4">

            {/* TCF Column */}
            <div className="rounded-xl border border-blue-200 bg-white/70 overflow-hidden">
              <div className="bg-blue-600 text-white px-4 py-2.5 flex items-center gap-2">
                <span className="font-black text-sm">TCF Expression Orale</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-blue-500 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" /> ≈ 12 min
                </span>
              </div>
              <div className="p-4 space-y-4 text-[13px]">

                {/* Task 1 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                    <span className="font-bold text-gray-800">Guided Interview <span className="text-gray-400 font-normal">(≈2 min)</span></span>
                  </div>
                  <p className="text-gray-600 pl-6 mb-1.5">The examiner asks simple personal questions.</p>
                  <div className="pl-6 space-y-1">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Examples</p>
                    {["Comment vous appelez-vous ?", "Où habitez-vous ?", "Que faites-vous ?"].map(ex => (
                      <div key={ex} className="text-[12px] bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-1.5 italic">{ex}</div>
                    ))}
                  </div>
                  <div className="pl-6 mt-2 space-y-0.5">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Skills tested</p>
                    <p className="text-[12px] text-gray-600">• Introducing yourself</p>
                    <p className="text-[12px] text-gray-600">• Talking about everyday topics</p>
                  </div>
                </div>

                {/* Task 2 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                    <span className="font-bold text-gray-800">Role Play <span className="text-gray-400 font-normal">(≈5–6 min)</span></span>
                  </div>
                  <p className="text-gray-600 pl-6 mb-1.5">You interact with the examiner in a real-life situation.</p>
                  <div className="pl-6 space-y-1">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Examples</p>
                    {["Ask about a French course.", "Rent an apartment.", "Buy a train ticket."].map(ex => (
                      <div key={ex} className="text-[12px] bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-1.5 italic">{ex}</div>
                    ))}
                  </div>
                </div>

                {/* Task 3 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">3</span>
                    <span className="font-bold text-gray-800">Express an Opinion <span className="text-gray-400 font-normal">(≈4–5 min)</span></span>
                  </div>
                  <p className="text-gray-600 pl-6 mb-1.5">You speak about a topic and explain your opinion.</p>
                  <div className="pl-6 space-y-1">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Examples</p>
                    {["Les réseaux sociaux sont-ils utiles ?", "Faut-il voyager souvent ?"].map(ex => (
                      <div key={ex} className="text-[12px] bg-blue-50 border border-blue-100 text-blue-800 rounded-lg px-3 py-1.5 italic">{ex}</div>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-500 pl-6 mt-1.5">Students are expected to organize and develop their ideas.</p>
                </div>
              </div>
            </div>

            {/* TEF Column */}
            <div className="rounded-xl border border-emerald-200 bg-white/70 overflow-hidden">
              <div className="bg-emerald-600 text-white px-4 py-2.5 flex items-center gap-2">
                <span className="font-black text-sm">TEF Expression Orale</span>
                <span className="ml-auto flex items-center gap-1 text-[10px] font-bold bg-emerald-500 px-2 py-0.5 rounded-md">
                  <Clock className="w-3 h-3" /> ≈ 15 min
                </span>
              </div>
              <div className="p-4 space-y-4 text-[13px]">

                {/* Task 1 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">1</span>
                    <span className="font-bold text-gray-800">Role Play</span>
                  </div>
                  <p className="text-gray-600 pl-6 mb-1.5">You are given a situation and interact with the examiner.</p>
                  <div className="pl-6 space-y-1">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Examples</p>
                    {["You want to rent a bicycle.", "You want information about a language course."].map(ex => (
                      <div key={ex} className="text-[12px] bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-3 py-1.5 italic">{ex}</div>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-500 pl-6 mt-1.5">Students ask questions and gather information.</p>
                </div>

                {/* Task 2 */}
                <div>
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="w-5 h-5 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center text-[10px] font-black shrink-0">2</span>
                    <span className="font-bold text-gray-800">Convince or Persuade</span>
                  </div>
                  <p className="text-gray-600 pl-6 mb-1.5">Students try to convince the examiner or defend their point of view.</p>
                  <div className="pl-6 space-y-1">
                    <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Examples</p>
                    {["Convince a friend to join a sports club.", "Persuade someone to visit your city."].map(ex => (
                      <div key={ex} className="text-[12px] bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg px-3 py-1.5 italic">{ex}</div>
                    ))}
                  </div>
                  <p className="text-[12px] text-gray-500 pl-6 mt-1.5">The examiner asks follow-up questions, making the interaction dynamic.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <MessageSquare className="w-4 h-4 text-violet-500" />
              <h3 className="font-black text-gray-900 text-sm">Main Differences</h3>
            </div>
            <div className="rounded-xl border border-violet-100 overflow-hidden text-[12px]">
              <div className="grid grid-cols-3 bg-violet-600 text-white font-bold text-[11px]">
                <div className="px-4 py-2.5">Feature</div>
                <div className="px-4 py-2.5 border-l border-violet-500">TCF</div>
                <div className="px-4 py-2.5 border-l border-violet-500">TEF</div>
              </div>
              {[
                ["Opening", "Starts with simple personal questions", "Starts directly with a role-play"],
                ["Opinion task", "Includes an opinion speech", "Focuses on persuading and interacting"],
                ["Style", "More structured progression", "More spontaneous conversation"],
                ["Tasks", "3 speaking tasks", "2 speaking tasks"],
                ["Duration", "≈ 12 minutes", "≈ 15 minutes"],
              ].map(([feature, tcf, tef], i) => (
                <div key={feature} className={`grid grid-cols-3 ${i % 2 === 0 ? "bg-white" : "bg-violet-50/50"}`}>
                  <div className="px-4 py-2.5 font-semibold text-gray-700">{feature}</div>
                  <div className="px-4 py-2.5 text-blue-700 border-l border-violet-100">{tcf}</div>
                  <div className="px-4 py-2.5 text-emerald-700 border-l border-violet-100">{tef}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Note about written */}
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3.5">
            <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
            <p className="text-[12px] text-amber-800">
              <strong>Note:</strong> If you&apos;re looking for the written section, that&apos;s called <strong>TCF Expression Écrite</strong>, where students write emails, messages, articles, or essays depending on the level being tested.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

type Quiz = {
  id: string; title: string; description: string; passMark: number; timeLimit: number | null
  questions: Question[]; isExamPrep: boolean; exam: string | null; section: string | null; level: string | null
}

const sectionIcons: Record<string, React.ReactNode> = {
  "Compréhension Orale": <Headphones className="w-4 h-4" />,
  "Compréhension Écrite": <BookOpen className="w-4 h-4" />,
  "Lexique et Structure": <Languages className="w-4 h-4" />,
  "Expression Écrite": <PenTool className="w-4 h-4" />,
  "Expression Orale": <Mic className="w-4 h-4" />,
}

function ExamPrepContent() {
  const { showToast } = useToast()
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Quiz>>({})
  const [saving, setSaving] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)
  const [filterSection, setFilterSection] = useState("all")
  const [newQuiz, setNewQuiz] = useState({ title: "", description: "", passMark: 60, timeLimit: "", exam: "TCF", section: examSections[0], level: "B1" })
  const [newQuestions, setNewQuestions] = useState<Question[]>([emptyQuestion(examSections[0])])

  useEffect(() => {
    fetch("/api/quizzes").then(r => r.json()).then(data => {
      setQuizzes((data || []).filter((q: Quiz) => q.isExamPrep))
    }).catch(() => showToast("Failed to load.")).finally(() => setLoading(false))
  }, [showToast])

  const handleCreate = async () => {
    if (!newQuiz.title.trim()) { showToast("Title is required."); return }
    if (newQuestions.some(q => !q.question.trim())) { showToast("All questions need text."); return }
    setCreating(true)
    try {
      const res = await fetch("/api/quizzes", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newQuiz.title, description: newQuiz.description, passMark: newQuiz.passMark,
          timeLimit: newQuiz.timeLimit ? Number(newQuiz.timeLimit) : null,
          isExamPrep: true, exam: newQuiz.exam, section: newQuiz.section, level: newQuiz.level,
          questions: newQuestions,
        }),
      })
      const created = await res.json()
      setQuizzes(prev => [created, ...prev])
      setShowNew(false)
      setNewQuiz({ title: "", description: "", passMark: 60, timeLimit: "", exam: "TCF", section: examSections[0], level: "B1" })
      setNewQuestions([emptyQuestion(examSections[0])])
      showToast("Exam quiz created!", "success")
    } catch { showToast("Failed to create.") }
    finally { setCreating(false) }
  }

  const handleSaveEdit = async () => {
    if (!editing) return
    setSaving(true)
    try {
      const res = await fetch(`/api/quizzes/${editing}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editForm.title, description: editForm.description, passMark: editForm.passMark,
          timeLimit: editForm.timeLimit || null, isExamPrep: true,
          exam: editForm.exam, section: editForm.section, level: editForm.level,
          questions: editForm.questions,
        }),
      })
      const updated = await res.json()
      setQuizzes(prev => prev.map(q => q.id === editing ? updated : q))
      showToast("Saved!", "success"); setEditing(null)
    } catch { showToast("Failed to save.") }
    finally { setSaving(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this exam quiz permanently?")) return
    try {
      await fetch(`/api/quizzes/${id}`, { method: "DELETE" })
      setQuizzes(prev => prev.filter(q => q.id !== id))
      showToast("Deleted.", "success")
    } catch { showToast("Failed to delete.") }
  }

  const updateNewQ = (idx: number, field: string, value: string | number | QuestionType) =>
    setNewQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q))
  const updateNewOpt = (qIdx: number, oIdx: number, value: string) =>
    setNewQuestions(prev => prev.map((q, i) => {
      if (i !== qIdx) return q; const opts = [...q.options]; opts[oIdx] = value; return { ...q, options: opts }
    }))

  const updateEditQ = (idx: number, field: string, value: string | number | QuestionType) => {
    if (!editForm.questions) return
    const qs = [...editForm.questions]; qs[idx] = { ...qs[idx], [field]: value }
    setEditForm({ ...editForm, questions: qs })
  }
  const updateEditOpt = (qIdx: number, oIdx: number, value: string) => {
    if (!editForm.questions) return
    const qs = [...editForm.questions]; const opts = [...qs[qIdx].options]; opts[oIdx] = value
    qs[qIdx] = { ...qs[qIdx], options: opts }; setEditForm({ ...editForm, questions: qs })
  }

  const filtered = filterSection === "all" ? quizzes : quizzes.filter(q => q.section === filterSection)

  if (loading) return (
    <div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />)}</div>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">TCF / TEF Exam Prep</h1>
          <p className="text-gray-500 font-medium mt-1">Create exam questions for all 5 sections across CEFR levels A1–C2.</p>
        </div>
        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-sm" onClick={() => setShowNew(!showNew)}>
          {showNew ? <X className="w-5 h-5 mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
          {showNew ? "Cancel" : "New Exam Quiz"}
        </Button>
      </div>

      {/* Section filter pills */}
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setFilterSection("all")}
          className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${filterSection === "all" ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
          All Sections
        </button>
        {examSections.map(s => (
          <button key={s} onClick={() => setFilterSection(s)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${filterSection === s ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"}`}>
            {sectionIcons[s]} {s}
          </button>
        ))}
      </div>

      {/* Expression Orale Info Panel */}
      {filterSection === "Expression Orale" && <ExpressionOraleInfoPanel />}

      {/* Create form */}
      {showNew && (
        <Card className="p-6 bg-white border border-indigo-200 rounded-2xl shadow-sm space-y-5">
          <h3 className="font-black text-gray-900 text-xl">Create Exam Quiz</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Title *</label>
              <Input className="h-10 rounded-xl border-gray-200" placeholder="e.g. TCF Listening - B1 Practice" value={newQuiz.title} onChange={e => setNewQuiz({ ...newQuiz, title: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Description</label>
              <Input className="h-10 rounded-xl border-gray-200" placeholder="Optional description" value={newQuiz.description} onChange={e => setNewQuiz({ ...newQuiz, description: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Exam</label>
              <select value={newQuiz.exam} onChange={e => setNewQuiz({ ...newQuiz, exam: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
                <option value="TCF">TCF</option><option value="TEF">TEF</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Section</label>
              <select value={newQuiz.section} onChange={e => {
                setNewQuiz({ ...newQuiz, section: e.target.value })
                setNewQuestions([emptyQuestion(e.target.value)])
              }}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
                {examSections.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">CEFR Level</label>
              <select value={newQuiz.level} onChange={e => setNewQuiz({ ...newQuiz, level: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200">
                {cefrLevels.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Pass Mark (%)</label>
              <Input className="h-10 rounded-xl border-gray-200" type="number" min={0} max={100} value={newQuiz.passMark} onChange={e => setNewQuiz({ ...newQuiz, passMark: Number(e.target.value) })} />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5">Time (min)</label>
              <Input className="h-10 rounded-xl border-gray-200" type="number" min={1} placeholder="No limit" value={newQuiz.timeLimit} onChange={e => setNewQuiz({ ...newQuiz, timeLimit: e.target.value })} />
            </div>
          </div>

          {/* Section info banner */}
          <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-3 flex items-center gap-2 text-sm text-indigo-700 font-medium">
            {sectionIcons[newQuiz.section]} Creating questions for: <strong>{newQuiz.section}</strong> ({newQuiz.exam} · {newQuiz.level})
          </div>

          {/* Questions */}
          <div className="space-y-4 pt-2 border-t border-gray-100">
            <h4 className="font-bold text-gray-900">Questions</h4>
            {newQuestions.map((q, qIdx) => (
              <QuestionForm key={qIdx} q={q} qIdx={qIdx} section={newQuiz.section}
                canRemove={newQuestions.length > 1}
                onUpdate={updateNewQ} onUpdateOption={updateNewOpt}
                onRemove={idx => setNewQuestions(prev => prev.filter((_, i) => i !== idx))} />
            ))}
            <Button variant="outline" size="sm" onClick={() => setNewQuestions(prev => [...prev, emptyQuestion(newQuiz.section)])}
              className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-bold">
              <Plus className="w-4 h-4 mr-1.5" /> Add Question
            </Button>
          </div>
          <div className="flex justify-end pt-2">
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2.5 rounded-xl shadow-sm" disabled={creating} onClick={handleCreate}>
              <Save className="w-5 h-5 mr-2" />{creating ? "Creating..." : "Create Quiz"}
            </Button>
          </div>
        </Card>
      )}

      {/* Quiz list */}
      {filtered.length === 0 && !showNew ? (
        <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-16 text-center">
          <div className="w-16 h-16 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-black text-gray-900 mb-2">No exam prep quizzes yet</h3>
          <p className="text-gray-500">Create your first TCF/TEF quiz to get started.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(quiz => (
            <Card key={quiz.id} className="bg-white border-gray-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpanded(expanded === quiz.id ? null : quiz.id)}>
                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 border border-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                  {sectionIcons[quiz.section || ""] || <BookOpen className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <h3 className="text-base font-bold text-gray-900 truncate">{quiz.title}</h3>
                    <span className="text-[10px] px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 rounded-md font-bold">{quiz.exam}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md font-bold">{quiz.level}</span>
                  </div>
                  <p className="text-xs text-gray-500">{quiz.section} · {quiz.questions?.length || 0} questions · Pass: {quiz.passMark}%</p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={e => { e.stopPropagation(); setEditing(quiz.id); setEditForm({ ...quiz }); setExpanded(quiz.id) }}
                    className="p-2 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={e => { e.stopPropagation(); handleDelete(quiz.id) }}
                    className="p-2 text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 className="w-4 h-4" /></button>
                  {expanded === quiz.id ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                </div>
              </div>

              {expanded === quiz.id && (
                <div className="border-t border-gray-100 p-5 space-y-4">
                  {editing === quiz.id ? (
                    <div className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-500 mb-1.5">Title</label>
                          <Input className="h-10 rounded-xl border-gray-200" value={editForm.title || ""} onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Exam</label>
                            <select value={editForm.exam || "TCF"} onChange={e => setEditForm({ ...editForm, exam: e.target.value })}
                              className="w-full px-2 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                              <option value="TCF">TCF</option><option value="TEF">TEF</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Section</label>
                            <select value={editForm.section || examSections[0]} onChange={e => setEditForm({ ...editForm, section: e.target.value })}
                              className="w-full px-2 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                              {examSections.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-500 mb-1.5">Level</label>
                            <select value={editForm.level || "B1"} onChange={e => setEditForm({ ...editForm, level: e.target.value })}
                              className="w-full px-2 py-2 border border-gray-200 rounded-xl text-sm bg-white">
                              {cefrLevels.map(l => <option key={l} value={l}>{l}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-bold text-gray-900">Questions</h4>
                        {editForm.questions?.map((q, qIdx) => (
                          <QuestionForm key={qIdx} q={q} qIdx={qIdx} section={editForm.section || examSections[0]}
                            canRemove={(editForm.questions?.length || 0) > 1}
                            onUpdate={updateEditQ} onUpdateOption={updateEditOpt}
                            onRemove={idx => setEditForm({ ...editForm, questions: editForm.questions!.filter((_, i) => i !== idx) })} />
                        ))}
                        <Button variant="outline" size="sm" onClick={() => setEditForm({ ...editForm, questions: [...(editForm.questions || []), emptyQuestion(editForm.section || examSections[0])] })}
                          className="border-gray-200 text-gray-600 hover:bg-gray-50 rounded-xl font-bold">
                          <Plus className="w-4 h-4 mr-1.5" /> Add Question
                        </Button>
                      </div>
                      <div className="flex justify-end gap-3 pt-3 border-t border-gray-100">
                        <Button variant="outline" size="sm" onClick={() => setEditing(null)} className="rounded-xl font-bold">Cancel</Button>
                        <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 rounded-xl" disabled={saving} onClick={handleSaveEdit}>
                          <Save className="w-4 h-4 mr-2" />{saving ? "Saving..." : "Save"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quiz.questions?.map((q, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-indigo-600 font-bold text-sm">{i + 1}.</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${q.questionType === "MULTIPLE_CHOICE" ? "bg-blue-50 text-blue-600 border border-blue-100" :
                              q.questionType === "FILL_IN_BLANK" ? "bg-purple-50 text-purple-600 border border-purple-100" :
                                q.questionType === "WRITING" ? "bg-amber-50 text-amber-600 border border-amber-100" :
                                  "bg-pink-50 text-pink-600 border border-pink-100"
                              }`}>
                              {q.questionType === "MULTIPLE_CHOICE" ? "MCQ" : q.questionType === "FILL_IN_BLANK" ? "Fill Blank" : q.questionType === "WRITING" ? "Writing" : "Speaking"}
                            </span>
                          </div>
                          {q.audioUrl && <p className="text-xs text-indigo-600 mb-2">🎧 Audio: <a href={q.audioUrl} target="_blank" rel="noreferrer" className="underline">{q.audioUrl}</a></p>}
                          {q.passage && <div className="text-xs text-gray-600 bg-white border border-gray-200 rounded-lg p-3 mb-2 italic">{q.passage}</div>}
                          <p className="font-semibold text-gray-800 text-sm mb-2">{q.question}</p>
                          {q.wordLimit && <p className="text-[10px] text-gray-500 mb-2">Word limit: {q.wordLimit}</p>}
                          {q.questionType === "MULTIPLE_CHOICE" && q.options?.length > 0 && (
                            <div className="space-y-1 mb-2">
                              {q.options.map((opt, oIdx) => (
                                <div key={oIdx} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${oIdx === q.correctAnswer ? "bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold" : "text-gray-500"}`}>
                                  {String.fromCharCode(65 + oIdx)}. {opt} {oIdx === q.correctAnswer && "✓"}
                                </div>
                              ))}
                            </div>
                          )}
                          {q.questionType === "FILL_IN_BLANK" && q.options?.[0] && (
                            <p className="text-xs text-purple-600 bg-purple-50 rounded-lg px-3 py-1.5 border border-purple-100 mb-2">Answer: {q.options[0]}</p>
                          )}
                          {q.explanation && (
                            <div className="text-xs text-gray-600 bg-indigo-50 p-3 rounded-lg border border-indigo-100 mt-2">
                              <span className="font-bold text-indigo-600">Explanation:</span> {q.explanation}
                            </div>
                          )}
                        </div>
                      ))}

                    </div>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeacherExamPrepPage() {
  return (
    <Suspense fallback={<div className="space-y-4">{[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 animate-pulse rounded-2xl" />)}</div>}>
      <ExamPrepContent />
    </Suspense>
  )
}
