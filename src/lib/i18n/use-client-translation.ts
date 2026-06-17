"use client"

import { useLangStore } from "./store"
import { useTranslation } from "./index"

export function useT() {
  const lang = useLangStore((s) => s.lang)
  return useTranslation(lang)
}
