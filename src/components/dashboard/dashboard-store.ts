import { create } from "zustand"
import { getDefaultLayout, type WidgetLayoutItem, WIDGET_REGISTRY } from "./widget-registry"

interface DashboardStore {
  layouts: WidgetLayoutItem[]
  visibleWidgets: string[]
  addWidget: (id: string) => void
  removeWidget: (id: string) => void
  updateLayout: (layouts: WidgetLayoutItem[]) => void
  resetLayout: () => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  layouts: getDefaultLayout(),
  visibleWidgets: WIDGET_REGISTRY.map((w) => w.id),

  addWidget: (id) => {
    set((state) => {
      if (state.visibleWidgets.includes(id)) return state

      const config = WIDGET_REGISTRY.find((w) => w.id === id)
      if (!config) return state

      const maxY = state.layouts.reduce((max, l) => Math.max(max, l.y + l.h), 0)

      return {
        visibleWidgets: [...state.visibleWidgets, id],
        layouts: [
          ...state.layouts,
          {
            i: id,
            x: 0,
            y: maxY,
            w: config.defaultW,
            h: config.defaultH,
            minW: config.minW,
            minH: config.minH,
          },
        ],
      }
    })
  },

  removeWidget: (id) => {
    set((state) => ({
      visibleWidgets: state.visibleWidgets.filter((w) => w !== id),
      layouts: state.layouts.filter((l) => l.i !== id),
    }))
  },

  updateLayout: (layouts) => set({ layouts }),

  resetLayout: () => set({ layouts: getDefaultLayout(), visibleWidgets: WIDGET_REGISTRY.map((w) => w.id) }),
}))
