import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { LanguageCode } from "./index"

type LangState = {
  lang: LanguageCode
  setLang: (lang: LanguageCode) => void
}

export const useLangStore = create<LangState>()(
  persist(
    (set) => ({
      lang: "en",
      setLang: (lang) => set({ lang }),
    }),
    { name: "ins-lang" },
  ),
)
