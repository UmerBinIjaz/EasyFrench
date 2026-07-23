import Link from "next/link"
import { GraduationCap } from "lucide-react"

export function Footer() {
  return (
    <footer className="bg-[#f8fafc] border-t border-gray-200 py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 sm:gap-6">

          {/* Brand */}
          <div className="flex flex-col sm:flex-row items-center gap-2 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#1a237e] rounded-md flex items-center justify-center shrink-0">
                <GraduationCap className="text-white" style={{ width: 14, height: 14 }} />
              </div>
              <span className="text-sm font-bold text-[#1a237e]">EasyFrench</span>
            </div>
            <span className="text-gray-400 text-xs sm:ml-1 max-w-xs leading-relaxed">
              High-performance learning management designed for professional academic environments.
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-xs font-medium text-gray-500">
            <a href="#" className="hover:text-gray-800 transition-colors touch-target">Privacy Policy</a>
            <a href="#" className="hover:text-gray-800 transition-colors touch-target">Terms of Service</a>
            <a href="#" className="hover:text-gray-800 transition-colors touch-target">Contact Support</a>
            <a href="#" className="hover:text-gray-800 transition-colors touch-target">Careers</a>
          </div>
        </div>

        <div className="mt-6 pt-5 border-t border-gray-200 text-center">
          <p className="text-xs text-gray-400 px-4">
            © {new Date().getFullYear()} EasyFrench. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
