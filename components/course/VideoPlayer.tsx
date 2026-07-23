"use client"

import { useState, useRef, useEffect } from "react"
import { Play, Pause, Volume2, VolumeX, Maximize, Settings } from "lucide-react"

interface VideoPlayerProps {
  url: string
  onProgress?: (progress: number) => void
  onComplete?: () => void
}

export function VideoPlayer({ url, onProgress, onComplete }: VideoPlayerProps) {
  // If it's a youtube embed url
  if (url.includes("youtube.com/embed")) {
    return (
      <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black shadow-lg">
        <iframe
          src={url}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>
    )
  }

  // Fallback for direct HTML5 video (mocked for now as we don't have real video files)
  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 shadow-lg group flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20 z-10 pointer-events-none" />
      
      <video
        src={url}
        className="absolute inset-0 w-full h-full object-cover"
        controls
      />
      
      {/* Custom controls overlay for mockup visual matching */}
      <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
        <button className="w-16 h-16 bg-blue-600/90 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-lg transition-transform hover:scale-105 pointer-events-auto backdrop-blur-sm">
          <Play className="w-8 h-8 ml-1" />
        </button>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="h-1 bg-white/30 rounded-full mb-4 cursor-pointer relative overflow-hidden">
          <div className="absolute top-0 left-0 bottom-0 bg-blue-500 w-1/3" />
        </div>
        <div className="flex items-center justify-between text-white">
          <div className="flex items-center gap-4">
            <button><Pause className="w-5 h-5" /></button>
            <button><Volume2 className="w-5 h-5" /></button>
            <span className="text-xs font-medium">04:22 / 12:45</span>
          </div>
          <div className="flex items-center gap-4">
            <button><Settings className="w-5 h-5" /></button>
            <button><Maximize className="w-5 h-5" /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
