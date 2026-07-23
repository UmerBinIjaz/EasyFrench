"use client"

import { useState, useRef } from "react"
import { X, Upload, FileText, Image as ImageIcon, CheckCircle2, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type Certificate = {
  id: string
  student: { name: string; email: string }
  course: { title: string }
}

interface UploadCertificateModalProps {
  certificate: Certificate
  onClose: () => void
  onUploaded: (certId: string) => void
}

export function UploadCertificateModal({ certificate, onClose, onUploaded }: UploadCertificateModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png", "image/webp"]
  const MAX_SIZE_MB = 10

  function validateFile(f: File): string | null {
    if (!ALLOWED_TYPES.includes(f.type)) return "Only PDF, JPG, PNG, or WEBP files are allowed."
    if (f.size > MAX_SIZE_MB * 1024 * 1024) return `File must be under ${MAX_SIZE_MB}MB.`
    return null
  }

  function handleFileSelect(f: File) {
    const err = validateFile(f)
    if (err) { setError(err); return }
    setError(null)
    setFile(f)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFileSelect(f)
  }

  async function handleUpload() {
    if (!file) return
    setUploading(true)
    setError(null)

    try {
      // Step 1: Upload the file
      const formData = new FormData()
      formData.append("file", file)
      const uploadRes = await fetch(`/api/certificates/${certificate.id}/upload`, {
        method: "POST",
        body: formData,
      })
      if (!uploadRes.ok) {
        const data = await uploadRes.json()
        throw new Error(data.error || "File upload failed")
      }
      const { url } = await uploadRes.json()

      // Step 2: Update the certificate record with the uploaded URL
      const patchRes = await fetch(`/api/certificates/${certificate.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "upload", downloadUrl: url }),
      })
      if (!patchRes.ok) {
        const data = await patchRes.json()
        throw new Error(data.error || "Failed to save certificate")
      }

      onUploaded(certificate.id)
    } catch (err: any) {
      setError(err.message || "An error occurred.")
    } finally {
      setUploading(false)
    }
  }

  const isImage = file && file.type.startsWith("image/")
  const isPdf = file && file.type === "application/pdf"
  const fileSizeMB = file ? (file.size / (1024 * 1024)).toFixed(2) : null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="bg-white border border-gray-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#1a237e]/10 border border-[#1a237e]/20 text-[#1a237e] rounded-2xl flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight">Upload Certificate</h2>
              <p className="text-sm font-medium text-gray-500">{certificate.student.name} · {certificate.course.title}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm font-medium flex items-center gap-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0" /> {error}
            </div>
          )}

          {/* Student info */}
          <div className="bg-gray-50 border border-gray-200 rounded-2xl p-5 grid grid-cols-2 gap-4">
            <div>
              <div className="text-[10px] font-black text-[#1a237e] uppercase tracking-wider mb-1">Student</div>
              <div className="font-bold text-gray-900 text-sm mb-0.5">{certificate.student.name}</div>
              <div className="text-gray-500 text-xs font-medium">{certificate.student.email}</div>
            </div>
            <div>
              <div className="text-[10px] font-black text-[#1a237e] uppercase tracking-wider mb-1">Course</div>
              <div className="font-bold text-gray-900 text-sm mb-0.5 truncate">{certificate.course.title}</div>
            </div>
          </div>

          {/* Drop zone */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-2">
              Certificate File <span className="text-red-500">*</span>
              <span className="ml-2 text-xs font-medium text-gray-500">PDF, JPG, PNG, WEBP · max {MAX_SIZE_MB}MB</span>
            </label>
            {!file ? (
              <div
                className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer ${dragOver ? "border-[#1a237e] bg-[#1a237e]/5" : "border-gray-300 hover:border-[#1a237e]/50 hover:bg-gray-50"
                  }`}
                onDrop={handleDrop}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => inputRef.current?.click()}
              >
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 transition-colors ${dragOver ? "bg-[#1a237e]/10 text-[#1a237e]" : "bg-gray-100 text-gray-400"}`}>
                  <Upload className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-gray-900 mb-1">Drag & drop or click to select</p>
                <p className="text-xs font-medium text-gray-500">PDF, JPG, PNG, or WEBP</p>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f) }}
                />
              </div>
            ) : (
              <div className="border border-gray-200 bg-gray-50 rounded-2xl p-5 flex items-center gap-4 animate-in fade-in">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${isPdf ? "bg-red-50 text-red-500 border-red-200" : "bg-[#1a237e]/10 text-[#1a237e] border-[#1a237e]/20"}`}>
                  {isPdf ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 text-sm truncate mb-0.5">{file.name}</p>
                  <p className="text-xs font-medium text-gray-500">{fileSizeMB} MB · {file.type}</p>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Info note */}
          <p className="text-xs font-medium text-gray-600 bg-gray-50 border border-gray-200 rounded-xl p-4 leading-relaxed">
            Once uploaded, the certificate will be marked as <strong className="text-gray-900 font-bold">Issued</strong> and the student can download it from their dashboard.
          </p>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={uploading} className="rounded-xl px-6 bg-white border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900 font-bold">
            Cancel
          </Button>
          <Button
            onClick={handleUpload}
            disabled={uploading || !file}
            className="bg-[#1a237e] hover:bg-[#283593] text-white font-bold rounded-xl px-8 shadow-sm transition-all duration-300"
          >
            {uploading ? (
              <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Uploading…</>
            ) : (
              <><CheckCircle2 className="w-5 h-5 mr-2" /> Upload & Issue</>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
