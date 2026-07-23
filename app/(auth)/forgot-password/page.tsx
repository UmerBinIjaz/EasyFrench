"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/providers/ToastProvider"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { showToast } = useToast()
  
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      })

      if (!res.ok) {
        const error = await res.json()
        showToast(error.message || "Email not found.")
        setIsLoading(false)
        return
      }

      // Email exists, proceed to reset password page
      router.push(`/reset-password?email=${encodeURIComponent(email)}`)
    } catch (err) {
      showToast("An unexpected error occurred.")
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-2">
        Forgot Password
      </h2>
      <p className="text-center text-sm text-slate-500 mb-6">
        Enter your email address to reset your password.
      </p>

      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Email address
          </label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@gmail.com"
          />
        </div>

        <Button type="submit" className="w-full touch-target" disabled={isLoading || !email}>
          {isLoading ? "Verifying..." : "Continue"}
        </Button>
      </form>

      <div className="mt-5 sm:mt-6 text-center text-sm">
        <span className="text-slate-500">
          Remember your password?{" "}
        </span>
        <Link
          href="/login"
          className="font-semibold text-[#1a237e] hover:text-[#283593] transition-colors"
        >
          Sign in
        </Link>
      </div>
    </>
  )
}
