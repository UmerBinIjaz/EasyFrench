"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { GraduationCap, Menu, X } from "lucide-react"

export default function LandingNav() {
  const [open, setOpen] = useState(false)

  // Close on resize to desktop
  useEffect(() => {
    const handler = () => { if (window.innerWidth >= 768) setOpen(false) }
    window.addEventListener("resize", handler)
    return () => window.removeEventListener("resize", handler)
  }, [])

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-[0_1px_4px_rgba(0,0,0,0.06)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0 no-underline" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 bg-[#1a237e] rounded-lg flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-extrabold text-[#1a237e]">EasyFrench</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#courses" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors no-underline">Catalog</a>
          <Link href="/exam-prep" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors no-underline">TCF/TEF Mock Tests</Link>
          <a href="#features" className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors no-underline">Features</a>
        </nav>

        {/* Desktop Auth Buttons */}
        <div className="hidden md:flex items-center gap-2">
          <Link href="/login" className="text-sm font-semibold text-white bg-[#1a237e] px-4 py-2 rounded-lg hover:bg-[#283593] transition-colors no-underline">
            Login
          </Link>
        </div>

        {/* Mobile: Hamburger only */}
        <button
          onClick={() => setOpen(!open)}
          className="flex md:hidden w-9 h-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Mobile Drawer ── */}
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 md:hidden ${open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={() => setOpen(false)}
      />

      {/* Slide-down panel */}
      <div
        className={`fixed top-14 left-0 right-0 z-50 bg-white border-b border-gray-200 shadow-xl transition-all duration-300 ease-in-out md:hidden overflow-hidden ${open ? "max-h-screen opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="px-4 py-4 flex flex-col gap-1">

          {/* Nav Links */}
          <a
            href="#courses"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#f3f4fb] hover:text-[#1a237e] transition-colors no-underline"
          >
            Catalog
          </a>
          <Link
            href="/exam-prep"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#f3f4fb] hover:text-[#1a237e] transition-colors no-underline"
          >
            TCF/TEF Mock Tests
          </Link>
          <a
            href="#features"
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-[#f3f4fb] hover:text-[#1a237e] transition-colors no-underline"
          >
            Features
          </a>

          {/* Divider */}
          <div className="my-2 border-t border-gray-100" />

          {/* Auth Buttons */}
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-[#1a237e] hover:bg-[#283593] transition-colors no-underline mt-1"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  )
}
