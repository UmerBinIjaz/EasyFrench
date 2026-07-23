"use client"

import { useEffect, useState, useCallback } from "react"
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react"

export type ToastType = "error" | "success" | "info"

export interface ToastData {
    id: string
    message: string
    type: ToastType
}

interface ToastProps {
    toast: ToastData
    onDismiss: (id: string) => void
}

const iconMap = {
    error: AlertCircle,
    success: CheckCircle2,
    info: Info,
}

const styleMap: Record<ToastType, string> = {
    error:
        "bg-rose-500/10 text-rose-400 border-rose-500/20",
    success:
        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    info:
        "bg-sky-500/10 text-sky-400 border-sky-500/20",
}

function ToastItem({ toast, onDismiss }: ToastProps) {
    const Icon = iconMap[toast.type]

    return (
        <div
            className={`pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium shadow-lg backdrop-blur-md animate-in fade-in slide-in-from-right-4 ${styleMap[toast.type]}`}
        >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{toast.message}</span>
            <button
                onClick={() => onDismiss(toast.id)}
                className="shrink-0 rounded-lg p-1 opacity-60 hover:opacity-100 transition-opacity"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

// ── Global toast container ──

interface ToastContainerProps {
    toasts: ToastData[]
    onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
    if (toasts.length === 0) return null

    return (
        <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
            {toasts.map((t) => (
                <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
            ))}
        </div>
    )
}

// ── Hook for managing toast state ──

let toastCounter = 0

export function useToastState() {
    const [toasts, setToasts] = useState<ToastData[]>([])

    const addToast = useCallback((message: string, type: ToastType = "error") => {
        const id = `toast-${++toastCounter}-${Date.now()}`
        setToasts((prev) => [...prev, { id, message, type }])

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 5000)
    }, [])

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    return { toasts, addToast, dismissToast }
}