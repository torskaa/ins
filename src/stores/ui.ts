"use client"

import { create } from "zustand"

interface UIState {
  sidebarOpen: boolean
  toggleSidebar: () => void
  setSidebarOpen: (open: boolean) => void
  searchQuery: string
  setSearchQuery: (q: string) => void
  globalLoading: boolean
  setGlobalLoading: (v: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  searchQuery: "",
  setSearchQuery: (q) => set({ searchQuery: q }),
  globalLoading: false,
  setGlobalLoading: (v) => set({ globalLoading: v }),
}))
