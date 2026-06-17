import { create } from "zustand"
import { useDashboardStore } from "./dashboard-store"

interface WidgetStore {
  activeWidgets: string[]
  setActiveWidgets: (ids: string[]) => void
  toggleWidget: (id: string) => void
  useWidget: (id: string) => void
  removeWidget: (id: string) => void
}

export const useWidgetStore = create<WidgetStore>((set) => ({
  activeWidgets: useDashboardStore.getState().visibleWidgets,

  setActiveWidgets: (ids) => set({ activeWidgets: ids }),

  toggleWidget: (id) => {
    set((state) => {
      const exists = state.activeWidgets.includes(id)
      const next = exists
        ? state.activeWidgets.filter((w) => w !== id)
        : [...state.activeWidgets, id]
      return { activeWidgets: next }
    })
  },

  useWidget: (id) => {
    const store = useDashboardStore.getState()
    if (!store.visibleWidgets.includes(id)) {
      store.addWidget(id)
    }
    set((state) => ({
      activeWidgets: state.activeWidgets.includes(id)
        ? state.activeWidgets
        : [...state.activeWidgets, id],
    }))
  },

  removeWidget: (id) => {
    const store = useDashboardStore.getState()
    store.removeWidget(id)
    set((state) => ({
      activeWidgets: state.activeWidgets.filter((w) => w !== id),
    }))
  },
}))
