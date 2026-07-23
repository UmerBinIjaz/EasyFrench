"use client"

import * as React from "react"
import { ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ModuleAccordionProps {
  module: any
  isOpen: boolean
  onToggle: () => void
  children: React.ReactNode
  completedLessonsCount: number
  totalLessons: number
}

export function ModuleAccordion({ module, isOpen, onToggle, children, completedLessonsCount, totalLessons }: ModuleAccordionProps) {
  const isCompleted = totalLessons > 0 && completedLessonsCount === totalLessons

  return (
    <div className="border border-white/5 rounded-xl overflow-hidden backdrop-blur-md mb-3">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 bg-transparent hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3">
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <div className="w-5 h-5 rounded-full border-2 border-slate-600 shrink-0 flex items-center justify-center">
              {completedLessonsCount > 0 && (
                <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />
              )}
            </div>
          )}
          <div className="text-left">
            <h4 className="font-semibold text-gray-900">{module.title}</h4>
            <div className="text-xs text-gray-400 mt-1">
              {completedLessonsCount} / {totalLessons} lessons completed
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <ChevronDown className={cn("w-5 h-5 text-gray-400 transition-transform duration-200", isOpen ? "rotate-180" : "")} />
        </div>
      </button>

      {isOpen && (
        <div className="border-t border-white/5 bg-white p-3">
          {children}
        </div>
      )}
    </div>
  )
}
