"use client"

import { useState, Suspense } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ShieldAlert } from "lucide-react"
import { useToast } from "@/components/providers/ToastProvider"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const accessDenied = searchParams.get("error") === "access_denied"
  const { showToast } = useToast()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (res?.error) {
        showToast(res.error)
        setIsLoading(false)
        return
      }

      // ⭐ WAIT FOR SESSION (IMPORTANT)
      const session = await getSession()

      const role = session?.user?.role

      if (role === "ADMIN") {
        router.push("/teacher")
      } else if (role === "TEACHER") {
        router.push("/teacher")
      } else {
        router.push("/dashboard")
      }

      router.refresh()
    } catch (err) {
      showToast("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6">
        Sign in to your account
      </h2>

      {accessDenied && (
        <div className="bg-amber-50 text-amber-700 p-3 rounded-md text-sm flex items-center gap-2 border border-amber-200 mb-4">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          You were signed out because you tried to access an area that is not allowed for your role.
        </div>
      )}

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

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <Link href="/forgot-password" className="text-sm font-medium text-[#1a237e] hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <Button type="submit" className="w-full touch-target" disabled={isLoading}>
          {isLoading ? "Signing in..." : "Sign in"}
        </Button>
      </form>

      <div className="mt-5 sm:mt-6 text-center text-sm">
        <span className="text-slate-500">
          Don't have an account?{" "}
        </span>
        <Link
          href="/register"
          className="font-semibold text-blue-600 hover:text-blue-500 touch-target inline-block"
        >
          Sign up
        </Link>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-8 text-sm text-slate-400 animate-pulse">
        Loading sign in form…
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}