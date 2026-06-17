import en from "./en"
import th from "./th"
import type { TranslationKeys } from "./en"

const translations: Record<string, TranslationKeys> = { en, th }

export type LanguageCode = "en" | "th"

export function getTranslation(lang: LanguageCode): TranslationKeys {
  return translations[lang] || en
}

export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  th: "ไทย",
}

export function useTranslation(lang: LanguageCode) {
  const t = getTranslation(lang)

  function _(key: string): string {
    const parts = key.split(".")
    let value: any = t
    for (const part of parts) {
      if (value && typeof value === "object" && part in value) {
        value = value[part]
      } else {
        return key
      }
    }
    return typeof value === "string" ? value : key
  }

  return { t: _, lang }
}
