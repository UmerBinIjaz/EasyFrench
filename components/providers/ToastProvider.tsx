"use client"

import { createContext, useContext, useCallback, useState } from "react"
import { ToastContainer, ToastType, ToastData } from "@/components/ui/toast"

interface ToastContextValue {
    showToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
    const ctx = useContext(ToastContext)
    if (!ctx) {
        throw new Error("useToast must be used within a ToastProvider")
    }
    return ctx
}

let toastCounter = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<ToastData[]>([])

    const dismissToast = useCallback((id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id))
    }, [])

    const showToast = useCallback((message: string, type: ToastType = "error") => {
        const id = `toast-${++toastCounter}-${Date.now()}`
        setToasts((prev) => [...prev, { id, message, type }])

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id))
        }, 5000)
    }, [])

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
        </ToastContext.Provider>
    )
}