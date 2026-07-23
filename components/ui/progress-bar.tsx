import * as React from "react"
import { cn } from "@/lib/utils"

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number
  max?: number
  indicatorColor?: string
}

const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, value, max = 100, indicatorColor = "bg-[#2e7d32]", ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100)

    return (
      <div
        ref={ref}
        className={cn("relative h-2 w-full overflow-hidden rounded-full bg-gray-200", className)}
        {...props}
      >
        <div
          className={cn("h-full transition-all duration-500 ease-in-out rounded-full", indicatorColor)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    )
  }
)
ProgressBar.displayName = "ProgressBar"

export { ProgressBar }
