"use client"

import { create } from "zustand"

export interface Toast {
  id: string
  type: "success" | "error" | "info" | "warning"
  title: string
  description?: string
  action?: { label: string; onClick: () => void }
  duration?: number
}

interface NotificationState {
  toasts: Toast[]
  add: (toast: Omit<Toast, "id">) => string
  dismiss: (id: string) => void
  clear: () => void
}

let counter = 0

export const useNotificationStore = create<NotificationState>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = `toast-${++counter}`
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    if (toast.duration !== 0) {
      setTimeout(() => {
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
      }, toast.duration || 4000)
    }
    return id
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))
