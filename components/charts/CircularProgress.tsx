"use client"

import { CircularProgressbar, buildStyles } from 'react-circular-progressbar'
import 'react-circular-progressbar/dist/styles.css'

interface CircularProgressProps {
  value: number
  text?: string
  color?: string
  trailColor?: string
  textColor?: string
}

export function CircularProgress({ 
  value, 
  text = `${value}%`, 
  color = '#2563eb', // blue-600
  trailColor = '#e2e8f0', // slate-200
  textColor = '#0f172a' // slate-900
}: CircularProgressProps) {
  return (
    <div className="w-full h-full max-w-[160px] max-h-[160px] relative font-bold">
      <CircularProgressbar
        value={value}
        text={text}
        strokeWidth={8}
        styles={buildStyles({
          textSize: '24px',
          pathColor: color,
          textColor: textColor,
          trailColor: trailColor,
          pathTransitionDuration: 0.5,
          strokeLinecap: 'round',
        })}
      />
    </div>
  )
}
