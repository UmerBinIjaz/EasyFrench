import * as React from "react"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-3 sm:p-4">
      <div
        className={cn("bg-white rounded-xl shadow-lg w-full max-w-[calc(100%-1.5rem)] sm:max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200", className)}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between p-3 sm:p-4 border-b">
          <h2 className="text-base sm:text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-1 rounded-full hover:bg-slate-100 transition-colors touch-target"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="p-3 sm:p-4">
          {children}
        </div>
      </div>
    </div>
  )
}
