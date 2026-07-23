import { ReactNode } from "react"
import Link from "next/link"

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link href="/" className="inline-block touch-target">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1a237e]">EasyFrench</h1>
        </Link>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-6 sm:py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-slate-200">
          {children}
        </div>
      </div>
    </div>
  )
}
