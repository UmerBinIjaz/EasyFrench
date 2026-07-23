"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "next-auth/react"
import { useToast } from "@/components/providers/ToastProvider"

export default function RegisterPage() {
  const router = useRouter()
  const { showToast } = useToast()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || "Something went wrong.")
        setIsLoading(false)
        return
      }

      // Auto sign in upon successful registration
      const signinRes = await signIn("credentials", {
        redirect: false,
        email,
        password,
      })

      if (signinRes?.error) {
        showToast("Account created, but failed to log in automatically. Please sign in manually.")
        router.push("/login")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      showToast("An unexpected error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <h2 className="text-center text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mb-4 sm:mb-6">
        Create an account
      </h2>

      <form className="space-y-4 sm:space-y-6" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium text-slate-700">Full Name</label>
          <div className="mt-1">
            <Input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Email address</label>
          <div className="mt-1">
            <Input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">Password</label>
          <div className="mt-1">
            <Input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
        </div>

        <Button type="submit" className="w-full touch-target" disabled={isLoading}>
          {isLoading ? "Creating account..." : "Sign up"}
        </Button>
      </form>

      <div className="mt-5 sm:mt-6 text-center text-sm">
        <span className="text-slate-500">Already have an account? </span>
        <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-500 touch-target inline-block">
          Sign in
        </Link>
      </div>
    </>
  )
}
