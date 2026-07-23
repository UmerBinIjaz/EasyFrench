"use client"

import { Input } from "@/components/ui/input"
import { useRef, useState, useCallback } from "react"
import { X, Mic, MicOff, Upload, Play, Pause, Trash2, Loader2, CheckCircle2 } from "lucide-react"

export type QuestionType = "MULTIPLE_CHOICE" | "FILL_IN_BLANK" | "WRITING" | "SPEAKING"

export type Question = {
  id?: string
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  questionType: QuestionType
  audioUrl: string
  passage: string
  wordLimit: string
}

export const examSections = [
  "Compréhension Orale",
  "Compréhension Écrite",
  "Lexique et Structure",
  "Expression Écrite",
  "Expression Orale",
]

export const cefrLevels = ["A1", "A2", "B1", "B2", "C1", "C2"]

export const sectionQuestionTypes: Record<string, { value: QuestionType; label: string }[]> = {
  "Compréhension Orale": [
    { value: "MULTIPLE_CHOICE", label: "Multiple Choice (Listening)" },
  ],
  "Compréhension Écrite": [
    { value: "MULTIPLE_CHOICE", label: "Multiple Choice (Reading)" },
  ],
  "Lexique et Structure": [
    { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
    { value: "FILL_IN_BLANK", label: "Fill in the Blank" },
  ],
  "Expression Écrite": [
    { value: "WRITING", label: "Writing Prompt" },
  ],
  "Expression Orale": [
    { value: "SPEAKING", label: "Speaking Prompt" },
  ],
}

export function emptyQuestion(section?: string): Question {
  const types = section ? sectionQuestionTypes[section] : null
  const defaultType = types?.[0]?.value || "MULTIPLE_CHOICE"
  return {
    question: "",
    options: defaultType === "MULTIPLE_CHOICE" ? ["", "", "", ""] : [],
    correctAnswer: 0,
    explanation: "",
    questionType: defaultType,
    audioUrl: "",
    passage: "",
    wordLimit: "",
  }
}

// ─── Voice Recorder/Uploader for Speaking Prompts ────────────────────────────
type VoiceRecorderProps = {
  audioUrl: string
  onAudioUrl: (url: string) => void
  promptText: string
  onPromptText: (text: string) => void
  rubric: string
  onRubric: (text: string) => void
  hideRubric?: boolean
  hidePromptText?: boolean
}

function VoiceRecorder({ audioUrl, onAudioUrl, promptText, onPromptText, rubric, onRubric, hideRubric, hidePromptText }: VoiceRecorderProps) {
  const [recording, setRecording] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localBlob, setLocalBlob] = useState<string | null>(null) // object URL before upload

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Recording ──
  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/ogg"
      const mr = new MediaRecorder(stream, { mimeType })
      chunksRef.current = []
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const objUrl = URL.createObjectURL(blob)
        setLocalBlob(objUrl)
        await uploadBlob(blob, mimeType)
      }
      mr.start()
      mediaRecorderRef.current = mr
      setRecording(true)
    } catch {
      setError("Microphone access denied. Please allow microphone permission and try again.")
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    setRecording(false)
  }, [])

  // ── Upload ──
  const uploadBlob = async (blob: Blob, mimeType: string) => {
    setUploading(true)
    setError(null)
    try {
      const ext = mimeType.includes("webm") ? "webm" : mimeType.includes("ogg") ? "ogg" : "wav"
      const formData = new FormData()
      formData.append("file", blob, `speaking_prompt.${ext}`)
      const res = await fetch("/api/upload/audio", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Upload failed")
      onAudioUrl(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Upload failed")
    } finally {
      setUploading(false)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setError(null)
    const objUrl = URL.createObjectURL(file)
    setLocalBlob(objUrl)
    await uploadBlob(file, file.type)
    e.target.value = ""
  }

  // ── Playback ──
  const togglePlay = () => {
    const src = audioUrl || localBlob
    if (!src) return
    if (!audioRef.current) {
      audioRef.current = new Audio(src)
      audioRef.current.onended = () => setPlaying(false)
    }
    if (playing) {
      audioRef.current.pause()
      setPlaying(false)
    } else {
      audioRef.current.src = src
      audioRef.current.play()
      setPlaying(true)
    }
  }

  const clearAudio = () => {
    audioRef.current?.pause()
    audioRef.current = null
    setPlaying(false)
    setLocalBlob(null)
    onAudioUrl("")
  }

  const hasAudio = !!(audioUrl || localBlob)

  return (
    <div className="space-y-4">
      {/* Prompt text */}
      {!hidePromptText && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">
            🎤 Speaking Prompt Text <span className="text-gray-400 font-normal">(displayed to student alongside audio)</span>
          </label>
          <textarea
            placeholder="e.g. Écoutez la question et répondez. / Listen and respond to the question."
            value={promptText}
            onChange={(e) => onPromptText(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 min-h-[60px] resize-y"
          />
        </div>
      )}

      {/* Audio recorder/uploader */}
      <div className="rounded-2xl border border-violet-200 bg-violet-50 p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-violet-600 rounded-lg flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-xs font-bold text-violet-900">Teacher Voice Prompt</p>
          <p className="text-[10px] text-violet-500 ml-auto">Students will listen to this before answering</p>
        </div>

        {/* Audio status */}
        {hasAudio && (
          <div className="flex items-center gap-2 bg-white rounded-xl border border-violet-200 px-3 py-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="text-xs text-gray-700 font-medium flex-1 truncate">
              {audioUrl ? `Audio saved: ${audioUrl.split("/").pop()}` : "Audio recorded (uploading...)"}
            </span>
            <button onClick={togglePlay}
              className="w-7 h-7 bg-violet-100 text-violet-700 rounded-lg flex items-center justify-center hover:bg-violet-200 transition-colors">
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>
            <button onClick={clearAudio}
              className="w-7 h-7 bg-rose-50 text-rose-500 rounded-lg flex items-center justify-center hover:bg-rose-100 transition-colors">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {uploading && (
          <div className="flex items-center gap-2 bg-white rounded-xl border border-indigo-200 px-3 py-2.5">
            <Loader2 className="w-4 h-4 text-indigo-500 animate-spin shrink-0" />
            <span className="text-xs text-indigo-700 font-medium">Uploading audio...</span>
          </div>
        )}

        {error && (
          <p className="text-[11px] text-rose-600 bg-rose-50 rounded-lg px-3 py-2 border border-rose-200">{error}</p>
        )}

        {/* Controls */}
        <div className="flex gap-2">
          {!recording ? (
            <button
              onClick={startRecording}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow-sm"
            >
              <Mic className="w-3.5 h-3.5" />
              {hasAudio ? "Re-record" : "Record Voice"}
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl transition-colors shadow-sm animate-pulse"
            >
              <MicOff className="w-3.5 h-3.5" />
              Stop Recording
            </button>
          )}

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={recording || uploading}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-violet-300 text-violet-700 hover:bg-violet-50 disabled:opacity-50 text-xs font-bold rounded-xl transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {recording && (
          <div className="flex items-center gap-2 text-rose-600">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[11px] font-bold">Recording… click Stop when done</span>
          </div>
        )}

        <p className="text-[10px] text-violet-500">
          Supported formats: MP3, WAV, OGG, WebM. Max recommended: 10 MB.
        </p>
      </div>

      {/* Rubric/model answer — with explanation */}
      {!hideRubric && (
        <div className="space-y-3">
          {/* Explainer card */}
          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3.5 space-y-2">
            <div className="flex items-start gap-2">
              <span className="text-amber-500 text-base leading-none mt-0.5">💡</span>
              <div>
                <p className="text-xs font-bold text-amber-900 mb-1">How Auto-Check Works for Speaking</p>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  The system does <strong>not</strong> expect all students to say the same thing. It checks for <strong>key vocabulary and grammar patterns</strong> from your rubric. Any keyword from the rubric that appears in the student&apos;s transcription earns points.
                </p>
              </div>
            </div>
            <div className="bg-white/70 rounded-lg border border-amber-100 p-3 space-y-1.5">
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Example — &ldquo;Comment vous appelez-vous?&rdquo;</p>
              <div className="space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-emerald-600 font-black shrink-0 mt-0.5">✓ WRITE:</span>
                  <p className="text-[11px] text-gray-700 italic">Je m&apos;appelle [nom]. J&apos;ai [âge] ans. Je suis [profession].</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-blue-600 font-black shrink-0 mt-0.5">→ CHECKS:</span>
                  <p className="text-[11px] text-gray-700">
                    Keywords extracted: <code className="bg-gray-100 px-1 rounded text-[10px]">appelle</code> <code className="bg-gray-100 px-1 rounded text-[10px]">ans</code> <code className="bg-gray-100 px-1 rounded text-[10px]">suis</code>
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-violet-600 font-black shrink-0 mt-0.5">✓ PASS:</span>
                  <p className="text-[11px] text-gray-700">
                    &ldquo;Je m&apos;appelle Ahmed, j&apos;ai 25 ans, je suis étudiant&rdquo; → 3/3 keywords → 10/10
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[10px] text-rose-500 font-black shrink-0 mt-0.5">✗ FAIL:</span>
                  <p className="text-[11px] text-gray-700">
                    &ldquo;My name is Ahmed&rdquo; → 0 French keywords → 0/10
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px]">
              <div className="bg-white/70 rounded-lg border border-amber-100 p-2">
                <p className="font-bold text-amber-700 mb-1">Include in rubric:</p>
                <ul className="space-y-0.5 text-amber-800">
                  <li>• A sample sentence structure</li>
                  <li>• Key verbs (m&apos;appelle, suis, habite)</li>
                  <li>• Expected French grammar</li>
                </ul>
              </div>
              <div className="bg-white/70 rounded-lg border border-amber-100 p-2">
                <p className="font-bold text-amber-700 mb-1">Do NOT include:</p>
                <ul className="space-y-0.5 text-amber-800">
                  <li>• Specific names or cities</li>
                  <li>• English words</li>
                  <li>• Only one exact answer</li>
                </ul>
              </div>
            </div>
            <p className="text-[10px] text-amber-600">
              Leave empty → system scores by French fluency only (length, structure, vocabulary, grammar).
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              Scoring Rubric <span className="text-gray-400 font-normal">(sample answer with key vocabulary)</span>
            </label>
            <textarea
              placeholder={`e.g. Je m'appelle [prénom]. J'ai [âge] ans. Je suis [profession]. J'habite à [ville].\n\nMots-clés attendus: appelle, suis, habite, ans`}
              value={rubric}
              onChange={(e) => onRubric(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400 min-h-[80px] resize-y"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main QuestionForm ────────────────────────────────────────────────────────
type Props = {
  q: Question
  qIdx: number
  section: string
  canRemove: boolean
  onUpdate: (idx: number, field: string, value: string | number | QuestionType) => void
  onUpdateOption: (qIdx: number, oIdx: number, value: string) => void
  onRemove: (idx: number) => void
}

export function QuestionForm({ q, qIdx, section, canRemove, onUpdate, onUpdateOption, onRemove }: Props) {
  const availableTypes = sectionQuestionTypes[section] || [{ value: "MULTIPLE_CHOICE", label: "Multiple Choice" }]
  const isListening = section === "Compréhension Orale"
  const isReading = section === "Compréhension Écrite"
  const isWriting = section === "Expression Écrite"
  const isSpeaking = section === "Expression Orale"
  const isMCQ = q.questionType === "MULTIPLE_CHOICE"
  const isFIB = q.questionType === "FILL_IN_BLANK"

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">
            Q{qIdx + 1}
          </span>
          {availableTypes.length > 1 && (
            <select
              value={q.questionType}
              onChange={(e) => onUpdate(qIdx, "questionType", e.target.value as QuestionType)}
              className="text-xs px-2 py-1 border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              {availableTypes.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          )}
        </div>
        {canRemove && (
          <button onClick={() => onRemove(qIdx)} className="text-gray-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-50 transition-colors">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Audio URL for listening */}
      {isListening && (
        <VoiceRecorder
          audioUrl={q.audioUrl || ""}
          onAudioUrl={(url) => onUpdate(qIdx, "audioUrl", url)}
          promptText={q.question || ""}
          onPromptText={(text) => onUpdate(qIdx, "question", text)}
          rubric={q.explanation || ""}
          onRubric={(text) => onUpdate(qIdx, "explanation", text)}
          hideRubric={true}
          hidePromptText={true}
        />
      )}

      {/* Reading passage */}
      {isReading && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1.5">📖 Reading Passage</label>
          <textarea
            placeholder="Paste the email, article, notice, or advertisement text here..."
            value={q.passage || ""}
            onChange={(e) => onUpdate(qIdx, "passage", e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 min-h-[100px] resize-y"
          />
        </div>
      )}

      {/* ── SPEAKING: Voice recorder widget ── */}
      {isSpeaking ? (
        <VoiceRecorder
          audioUrl={q.audioUrl || ""}
          onAudioUrl={(url) => onUpdate(qIdx, "audioUrl", url)}
          promptText={q.question || ""}
          onPromptText={(text) => onUpdate(qIdx, "question", text)}
          rubric={q.explanation || ""}
          onRubric={(text) => onUpdate(qIdx, "explanation", text)}
        />
      ) : (
        <>
          {/* Question text for non-speaking */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              {isWriting ? "✍️ Writing Prompt" : "❓ Question"}
            </label>
            <textarea
              placeholder={
                isWriting ? "e.g. Votre voisin fait beaucoup de bruit chaque nuit. Écrivez un courriel..." :
                isListening ? "e.g. À quelle heure ferme le magasin ?" :
                "e.g. Quel est le but de ce courriel ?"
              }
              value={q.question || ""}
              onChange={(e) => onUpdate(qIdx, "question", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 min-h-[70px] resize-y"
            />
          </div>

          {/* Word limit for writing */}
          {isWriting && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Word Limit</label>
              <Input
                className="h-10 rounded-xl border-gray-200 text-sm focus:border-indigo-400 focus:ring-indigo-200 w-40"
                placeholder="e.g. 80-120"
                value={q.wordLimit || ""}
                onChange={(e) => onUpdate(qIdx, "wordLimit", e.target.value)}
              />
            </div>
          )}

          {/* MCQ options */}
          {isMCQ && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-gray-500 block">Answer Options</label>
              {q.options.map((opt, oIdx) => (
                <div key={oIdx} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`q-${qIdx}-correct`}
                    checked={q.correctAnswer === oIdx}
                    onChange={() => onUpdate(qIdx, "correctAnswer", oIdx)}
                    className="w-4 h-4 accent-indigo-600 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-500 w-5">{String.fromCharCode(65 + oIdx)}.</span>
                  <Input
                    className="h-9 rounded-lg border-gray-200 text-sm flex-1 focus:border-indigo-400 focus:ring-indigo-200"
                    placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                    value={opt}
                    onChange={(e) => onUpdateOption(qIdx, oIdx, e.target.value)}
                  />
                  {q.correctAnswer === oIdx && (
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">✓ Correct</span>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Fill in blank answer */}
          {isFIB && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5">Correct Answer</label>
              <Input
                className="h-10 rounded-xl border-gray-200 text-sm focus:border-indigo-400 focus:ring-indigo-200"
                placeholder="The correct word or phrase"
                value={q.options[0] || ""}
                onChange={(e) => onUpdateOption(qIdx, 0, e.target.value)}
              />
            </div>
          )}

          {/* Explanation for non-speaking */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">
              {isWriting ? "Model Answer / Rubric (optional)" : "Explanation (optional)"}
            </label>
            <textarea
              placeholder={isWriting ? "Provide expected answer or grading rubric..." : "Explain the correct answer..."}
              value={q.explanation || ""}
              onChange={(e) => onUpdate(qIdx, "explanation", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 min-h-[60px] resize-y"
            />
          </div>
        </>
      )}
    </div>
  )
}
