"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { User, BookOpen, CheckCircle2, Award, HelpCircle, AlertCircle, Save } from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"

export default function ProfilePage() {
  const { data: session, update } = useSession()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile")
        const data = await res.json()
        setProfile(data)
        setName(data.name || "")
        setBio(data.bio || "")
      } catch {
        console.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const body: Record<string, string> = { name, bio }
      if (newPassword) {
        body.currentPassword = currentPassword
        body.newPassword = newPassword
      }

      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || "Update failed.")
      } else {
        showToast("Profile updated successfully!", "success")
        setCurrentPassword("")
        setNewPassword("")
        setProfile({ ...profile, ...data })
        await update({ name: data.name })
      }
    } catch {
      showToast("An unexpected error occurred.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-56 bg-slate-100 animate-pulse rounded" />
        <div className="grid md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-xl" />)}
        </div>
      </div>
    )
  }

  const stats = [
    { label: "Enrolled Courses", value: profile?._count?.enrollments ?? 0, icon: BookOpen, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Lessons Completed", value: profile?._count?.progress ?? 0, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-100" },
    { label: "Quizzes Taken", value: profile?._count?.quizResults ?? 0, icon: HelpCircle, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Certificates", value: profile?._count?.certificates ?? 0, icon: Award, color: "text-amber-600", bg: "bg-amber-100" },
  ]

  return (
    <div className="space-y-6 sm:space-y-8 max-w-3xl animate-in fade-in duration-500 px-4 sm:px-0">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400 text-sm sm:text-base">Manage your account details and password.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="p-3 sm:p-4 flex flex-col items-center text-center gap-2">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl ${stat.bg.replace('bg-', 'bg-').includes('100') ? 'bg-blue-500/10' : 'bg-blue-500/10'} ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="text-xl sm:text-2xl font-bold text-white">{stat.value}</div>
            <div className="text-[10px] sm:text-xs font-medium text-slate-400">{stat.label}</div>
          </Card>
        ))}
      </div>

      {/* Edit Form */}
      <Card className="p-4 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 pb-5 sm:pb-6 border-b border-white/5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl flex items-center justify-center shrink-0">
            <User className="w-7 h-7 sm:w-8 sm:h-8" />
          </div>
          <div className="text-center sm:text-left">
            <h2 className="text-lg sm:text-xl font-bold text-white">{profile?.name}</h2>
            <p className="text-slate-400 text-xs sm:text-sm break-all sm:break-normal">{profile?.email}</p>
            <span className="inline-block mt-1 px-2.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
              {profile?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-white">Account Information</h3>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">Full Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Tell us a little about yourself..."
                rows={3}
                className="w-full px-3 py-2 border border-white/10 bg-white/5 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none placeholder:text-slate-500"
              />
            </div>
          </div>

          <div className="space-y-3 sm:space-y-4 pt-5 sm:pt-6 border-t border-white/5">
            <h3 className="text-sm sm:text-base font-semibold text-white">Change Password</h3>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">Current Password</label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-slate-400 mb-1">New Password</label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button type="submit" disabled={saving} className="bg-gradient-to-r from-blue-600 to-violet-600 border-0 text-white font-bold touch-target">
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
