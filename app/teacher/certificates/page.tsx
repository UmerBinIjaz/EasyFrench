"use client"

import { useEffect, useState, useCallback } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Award, CheckCircle2, Clock, Plus, Layers, BookOpen,
  Trash2, FileCheck, Pencil, Hash, Eye,
  Image as ImageIcon, Upload, Inbox, Badge
} from "lucide-react"
import { UploadCertificateModal } from "@/components/certificate/UploadCertificateModal"
import { useToast } from "@/components/providers/ToastProvider"

// ── Types ────────────────────────────────────────────────────────────────────

type Template = {
  id: string
  name: string
  description: string | null
  backgroundImage: string | null
  logoImage: string | null
  signatureImage: string | null
  certificateTitle: string
  primaryColor: string
  fontFamily: string
  _count?: { courses: number }
}

type Certificate = {
  id: string
  status: string
  createdAt: string
  issuedAt: string | null
  certificateNumber: string | null
  downloadUrl: string | null
  student: { name: string; email: string }
  course: { title: string }
  template: { name: string } | null
  templateId: string | null
}

type Course = {
  id: string
  title: string
  certificateTemplateId: string | null
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  })
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function TeacherCertificatesPage() {
  const { showToast } = useToast()
  const [tab, setTab] = useState<"pending" | "issued">("pending")

  const [certificates, setCertificates] = useState<Certificate[]>([])
  const [certsLoading, setCertsLoading] = useState(true)
  const [filter, setFilter] = useState<"ALL" | "ISSUED" | "PENDING">("ALL")

  // Certificate action modal state
  const [uploadingCert, setUploadingCert] = useState<Certificate | null>(null)

  // ── Loaders ────────────────────────────────────────────────────────────────

  const loadCertificates = useCallback(async () => {
    setCertsLoading(true)
    try {
      const res = await fetch("/api/certificates")
      const data = await res.json()
      setCertificates(Array.isArray(data) ? data : [])
    } catch {
      showToast("Failed to load certificates.")
    } finally {
      setCertsLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadCertificates()
  }, [loadCertificates])

  // ── Handlers ───────────────────────────────────────────────────────────────

  function handleCertIssued(certId: string) {
    setCertificates((prev) => prev.map((c) =>
      c.id === certId ? { ...c, status: "ISSUED", issuedAt: new Date().toISOString() } : c
    ))
    setUploadingCert(null)
    showToast("Certificate issued successfully! The student can now view and download it.", "success")
  }

  const pendingCerts = certificates.filter((c) => c.status === "PENDING")
  const filteredCerts = filter === "ALL" ? certificates
    : certificates.filter((c) => c.status === filter)

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Certificates</h1>
          <p className="text-gray-900 font-medium">Review pending requests and upload certificates.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white/5 backdrop-blur-md p-1.5 rounded-2xl w-fit border border-white/10">
        {([
          { key: "pending", label: "Pending Requests", icon: Inbox, badge: pendingCerts.length },
          { key: "issued", label: "Issued Certificates", icon: FileCheck, badge: undefined },
        ] as const).map(({ key, label, icon: Icon, badge }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${tab === key ? "bg-indigo-500 text-white shadow-md shadow-indigo-500/20" : "text-gray-900 hover:text-gray-900 hover:bg-white/5"
              }`}
          >
            <Icon className="w-4 h-4" /> {label}
            {badge !== undefined && badge > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-black ${tab === key ? "bg-white/20 text-gray-900" : "bg-rose-500/20 text-rose-400 border border-rose-500/20"
                }`}>{badge}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── PENDING REQUESTS TAB ── */}
      {tab === "pending" && (
        <div className="space-y-4 animate-in fade-in">
          {certsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white/5 border border-white/10 animate-pulse rounded-3xl" />)}
            </div>
          ) : pendingCerts.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center backdrop-blur-md">
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Inbox className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="font-black text-gray-900 mb-2 text-xl tracking-tight">No pending requests</h3>
              <p className="text-gray-900 font-medium max-w-sm mx-auto">
                When students complete all lessons in a course, their certificate request will appear here for you to review.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingCerts.map((cert) => (
                <Card key={cert.id} className="p-6 bg-white/5 backdrop-blur-md border-white/10 rounded-3xl shadow-sm hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-5 flex-wrap">
                    {/* Status badge */}
                    <div className="w-14 h-14 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center shrink-0">
                      <Clock className="w-7 h-7" />
                    </div>

                    {/* Student + Course info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <p className="font-black text-gray-900 text-lg tracking-tight">{cert.student.name}</p>
                        <span className="text-[10px] px-2.5 py-1 rounded-md font-bold tracking-wider uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          Pending Approval
                        </span>
                      </div>
                      <p className="text-gray-600-300 font-bold mb-1">{cert.course.title}</p>
                      <p className="text-xs text-gray-900 font-medium">{cert.student.email} · Requested {formatDate(cert.createdAt)}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => setUploadingCert(cert)}
                        className="rounded-xl px-5 py-2.5 font-bold gap-2 bg-indigo-500 hover:bg-indigo-600 text-white shadow-sm border border-indigo-400/30 transition-all duration-300"
                      >
                        <Upload className="w-4 h-4" /> Upload Certificate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}



      {/* ── ISSUED CERTIFICATES TAB ── */}
      {tab === "issued" && (
        <div className="space-y-6 animate-in fade-in">
          {/* Filter pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {(["ALL", "ISSUED", "PENDING"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 border ${filter === f ? "bg-indigo-500 text-white border-indigo-400/30 shadow-md shadow-indigo-500/20" : "bg-white/5 text-gray-600-300 border-white/10 hover:bg-white/10 hover:text-gray-900"
                  }`}
              >
                {f}
                <span className={`ml-2 text-[10px] px-2 py-0.5 rounded-md font-black tracking-wider ${filter === f ? "bg-white/20 text-gray-900" : "bg-black/20 text-gray-900"}`}>
                  {f === "ALL" ? certificates.length : certificates.filter((c) => c.status === f).length}
                </span>
              </button>
            ))}
          </div>

          {certsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-white/5 border border-white/10 animate-pulse rounded-3xl" />)}
            </div>
          ) : filteredCerts.length === 0 ? (
            <div className="bg-white/5 border border-dashed border-white/10 rounded-3xl p-16 text-center backdrop-blur-md">
              <div className="w-20 h-20 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Award className="w-10 h-10 text-indigo-400" />
              </div>
              <h3 className="font-black text-gray-900 mb-2 text-xl tracking-tight">No certificates found</h3>
              <p className="text-gray-900 font-medium">Issued certificates will appear here after approval.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCerts.map((cert) => (
                <Card key={cert.id} className="p-6 bg-white/5 backdrop-blur-md border-white/10 rounded-3xl shadow-sm hover:bg-white/10 transition-colors group">
                  <div className="flex items-center gap-5 flex-wrap">
                    {/* Status icon */}
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${cert.status === "ISSUED" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" :
                      cert.status === "APPROVED" ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" :
                        "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                      }`}>
                      {cert.status === "ISSUED" ? <Award className="w-7 h-7" /> :
                        cert.status === "APPROVED" ? <CheckCircle2 className="w-7 h-7" /> :
                          <Clock className="w-7 h-7" />}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap mb-2">
                        <p className="font-black text-gray-900 text-lg tracking-tight">{cert.student.name}</p>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">{cert.student.email}</p>
                      <p className="text-sm text-gray-600-300 font-bold mb-2">{cert.course.title}</p>
                      <div className="flex items-center gap-4 mt-2 flex-wrap">
                        {cert.template && (
                          <p className="text-xs font-bold text-gray-900 flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-gray-600-500" /> Template: {cert.template.name}</p>
                        )}
                        {cert.certificateNumber && (
                          <p className="text-xs text-indigo-400 font-mono font-bold flex items-center gap-1.5">
                            <Hash className="w-3.5 h-3.5" /> {cert.certificateNumber}
                          </p>
                        )}
                        {cert.downloadUrl && (
                          <a
                            href={cert.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-emerald-400 font-bold hover:text-emerald-300 transition-colors flex items-center gap-1.5 bg-emerald-500/10 px-2 py-1 rounded-md border border-emerald-500/20"
                          >
                            <FileCheck className="w-3.5 h-3.5" /> View Uploaded File
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Status + date */}
                    <div className="text-right shrink-0">
                      <span className={`inline-block text-[10px] px-3 py-1.5 rounded-md font-bold tracking-wider uppercase ${cert.status === "ISSUED" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                        cert.status === "APPROVED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                        {cert.status}
                      </span>
                      <p className="text-xs text-gray-900 font-medium mt-2">
                        {cert.issuedAt ? `Issued: ${formatDate(cert.issuedAt)}` : `Requested: ${formatDate(cert.createdAt)}`}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Upload Certificate Modal ── */}
      {uploadingCert && (
        <UploadCertificateModal
          certificate={uploadingCert}
          onClose={() => setUploadingCert(null)}
          onUploaded={handleCertIssued}
        />
      )}
    </div>
  )
}