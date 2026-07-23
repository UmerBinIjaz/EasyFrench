import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

import { ShieldAlert, Award, Clock, Download, ExternalLink } from "lucide-react"

export default async function CertificatesPage() {
  const session = await getServerSession(authOptions)
  if (!session) return null

  // Fetch ALL certificates (PENDING + ISSUED) so student can see their status
  const allCertificates = await prisma.certificate.findMany({
    where: { studentId: session.user.id },
    include: {
      course: {
        include: {
          createdBy: { select: { name: true } },
        },
      },
      student: { select: { name: true } },
      template: {
        select: {
          id: true,
          name: true,
          certificateTitle: true,
          backgroundImage: true,
          logoImage: true,
          signatureImage: true,
          primaryColor: true,
          fontFamily: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const issuedCerts = allCertificates.filter((c) => c.status === "ISSUED")
  const pendingCerts = allCertificates.filter((c) => c.status === "PENDING" || c.status === "APPROVED")

  return (
    <div className="space-y-8 sm:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700 px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 text-center sm:text-left">
        <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <Award className="w-6 h-6 sm:w-7 sm:h-7 text-gray-900" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 mb-1 tracking-tight">My Certificates</h1>
          <p className="text-gray-600 font-medium text-sm sm:text-base">
            Your earned diplomas and certificates — complete any course to earn more.
          </p>
        </div>
      </div>

      {/* Stats row */}
      {allCertificates.length > 0 && (
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          {[
            { label: "Certificates Earned", value: issuedCerts.length, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/25" },
            { label: "Pending Approval", value: pendingCerts.length, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/25" },
            {
              label: "Latest",
              value: issuedCerts[0]
                ? new Date(issuedCerts[0].issuedAt || issuedCerts[0].createdAt).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })
                : "—",
              color: "text-blue-400",
              bg: "bg-blue-500/10 border-blue-500/25",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`border rounded-2xl sm:rounded-3xl p-3 sm:p-5 text-center ${stat.bg}`}
            >
              <p className={`text-lg sm:text-2xl font-black mb-1 ${stat.color}`}>{stat.value}</p>
              <p className="text-[10px] sm:text-xs text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── PENDING CERTIFICATES ── */}
      {pendingCerts.length > 0 && (
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mb-3 sm:mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            Awaiting Approval
          </h2>
          <div className="space-y-3">
            {pendingCerts.map((cert) => (
              <div
                key={cert.id}
                className="bg-amber-500/10 border border-amber-500/20 rounded-2xl sm:rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5"
              >
                <div className="w-10 h-10 sm:w-14 sm:h-14 bg-amber-500/15 border border-amber-500/25 text-amber-400 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                  <Clock className="w-5 h-5 sm:w-7 sm:h-7" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">{cert.course.title}</h3>
                    <span className="text-[10px] sm:text-xs px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      Pending Approval
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    Course completed · Certificate request submitted to your teacher
                  </p>
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    Requested on {new Date(cert.createdAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="shrink-0 self-start sm:self-auto">
                  <div className="inline-flex items-center gap-1.5 bg-amber-500/15 text-amber-400 border border-amber-500/25 text-[10px] sm:text-xs font-bold px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl">
                    <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                    Teacher reviewing
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── ISSUED CERTIFICATES ── */}
      {issuedCerts.length > 0 ? (
        <section>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 tracking-tight mb-3 sm:mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
            Issued Certificates
          </h2>
          <div className="grid sm:grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {issuedCerts.map((cert) => (
              <div key={cert.id} className="space-y-3">
                {/* If certificate has an uploaded file (PDF/image from teacher), show download button */}
                {cert.downloadUrl ? (
                  <div className="bg-white/20 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{cert.course.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Issued by {cert.course.createdBy?.name || "Teacher"} ·{" "}
                          {cert.issuedAt
                            ? new Date(cert.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : ""}
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-xl font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        ISSUED
                      </span>
                    </div>
                    <a
                      href={cert.downloadUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-xl font-bold text-xs sm:text-sm hover:opacity-90 transition-all hover:-translate-y-0.5 shadow-lg shadow-blue-500/20 border-0 touch-target"
                    >
                      <Download className="w-4 h-4" /> Download Certificate
                    </a>
                    {cert.certificateNumber && (
                      <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-2 font-mono truncate px-2">{cert.certificateNumber}</p>
                    )}
                  </div>
                ) : (
                  /* Fallback for old certificates without a downloadUrl */
                  <div className="bg-white/20 border border-white/5 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xl backdrop-blur-md">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0">
                        <Award className="w-5 h-5 sm:w-6 sm:h-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm sm:text-base truncate">{cert.course.title}</h3>
                        <p className="text-xs sm:text-sm text-gray-600">
                          Issued by {cert.course.createdBy?.name || "Teacher"} ·{" "}
                          {cert.issuedAt
                            ? new Date(cert.issuedAt).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })
                            : ""}
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-[10px] sm:text-xs px-2 sm:px-2.5 py-1 rounded-xl font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                        ISSUED
                      </span>
                    </div>
                    <div className="flex flex-col items-center justify-center gap-2 p-3 sm:p-4 bg-white/5 rounded-xl border border-dashed border-white/10">
                      <p className="text-xs sm:text-sm text-gray-600 font-medium text-center">
                        Certificate file is missing. Please contact your teacher to upload it.
                      </p>
                    </div>
                    {cert.certificateNumber && (
                      <p className="text-center text-[10px] sm:text-xs text-gray-500 mt-3 sm:mt-4 font-mono truncate px-2">{cert.certificateNumber}</p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : pendingCerts.length === 0 ? (
        /* Completely empty state */
        <div className="bg-white/5 border-2 border-dashed border-white/10 rounded-2xl sm:rounded-3xl p-8 sm:p-16 text-center text-gray-600">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/5 border border-white/10 text-gray-600 rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-5">
            <ShieldAlert className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">No certificates yet</h3>
          <p className="text-gray-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed">
            Complete all lessons in a course to submit your certificate request. Your teacher will then review and issue your official certificate.
          </p>
        </div>
      ) : null}
    </div>
  )
}
