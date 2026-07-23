import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "navy" | "green" | "orange" | "purple" | "red" | "teal" | "outline" | "destructive" | "secondary" | "success"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants: Record<string, string> = {
    default:     "bg-[#e8eaf6] text-[#1a237e] border-transparent",
    navy:        "bg-[#e8eaf6] text-[#1a237e] border-transparent",
    green:       "bg-[#e8f5e9] text-[#2e7d32] border-transparent",
    orange:      "bg-[#fff3e0] text-[#e65100] border-transparent",
    purple:      "bg-[#ede7f6] text-[#6a1b9a] border-transparent",
    red:         "bg-[#ffebee] text-[#c62828] border-transparent",
    teal:        "bg-[#e0f2f1] text-[#00695c] border-transparent",
    outline:     "border-gray-300 text-gray-700 bg-transparent",
    secondary:   "bg-gray-100 text-gray-700 border-transparent",
    destructive: "bg-red-100 text-red-700 border-transparent",
    success:     "bg-[#e8f5e9] text-[#2e7d32] border-transparent",
  }

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
