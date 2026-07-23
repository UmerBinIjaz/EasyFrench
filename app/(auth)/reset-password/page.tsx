"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/providers/ToastProvider"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const email = searchParams.get("email")
  const { showToast } = useToast()

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!email) {
      router.push("/forgot-password")
    }
  }, [email, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      showToast("Passwords do not match")
      return
    }

    if (password.length < 6) {
      showToast("Password must be at least 6 characters")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      })

      if (!res.ok) {
        const error = await res.json()
        showToast(error.message || "Failed to reset password")
        setIsLoading(false)
        return
      }

      showToast("Password successfully reset. You can now login.", "success")
      router.push("/login")
    } catch (err) {
      showToast("An unexpected error occurred.")
      setIsLoading(false)
    }
  }

  if (!email) return null // Prevent rendering until redirect happens if missing email

  return (
    <>
      <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">
        Reset Password
      </h2>
      <p className="text-center text-sm text-slate-500 mb-6">
        Create a new password for <span className="font-semibold text-slate-700">{email}</span>.
      </p>

      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            New Password
          </label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirm New Password
          </label>
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full touch-target" disabled={isLoading || !password || !confirmPassword}>
          {isLoading ? "Resetting..." : "Reset Password"}
        </Button>
      </form>

      <div className="mt-5 sm:mt-6 text-center text-sm">
        <Link
          href="/login"
          className="font-semibold text-[#1a237e] hover:text-[#283593] transition-colors"
        >
          Back to Login
        </Link>
      </div>
    </>
  )
}
