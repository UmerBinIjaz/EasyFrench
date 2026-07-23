import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "accent" | "destructive" | "outline" | "ghost" | "secondary" | "link"
  size?: "default" | "sm" | "lg" | "icon"
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const base =
      "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1a237e] focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 touch-target"

    const variants: Record<string, string> = {
      default: "bg-[#1a237e] text-white hover:bg-[#283593] shadow-sm",
      primary: "bg-[#1a237e] text-white hover:bg-[#283593] shadow-sm",
      accent: "bg-[#2e7d32] text-white hover:bg-[#388e3c] shadow-sm",
      destructive: "bg-red-600 text-white hover:bg-red-700 shadow-sm",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400",
      secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
      ghost: "text-gray-600 hover:bg-gray-100 hover:text-gray-900",
      link: "text-[#1a237e] underline-offset-4 hover:underline p-0 h-auto shadow-none",
    }

    const sizes: Record<string, string> = {
      default: "h-10 px-4 py-2",
      sm: "h-8 px-3 py-1.5 text-xs rounded-md",
      lg: "h-11 px-6 py-2.5 text-base",
      icon: "h-10 w-10",
    }

    return (
      <button
        className={cn(base, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
