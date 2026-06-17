"use client"

import { useLangStore } from "@/lib/i18n/store"
import { LANGUAGE_NAMES, type LanguageCode } from "@/lib/i18n"
import { Globe } from "lucide-react"

export function LanguageSwitcher({ collapsed }: { collapsed?: boolean }) {
 const { lang, setLang } = useLangStore()

 const toggleLang = () => {
 const next = lang === "en" ? "th" : "en"
 setLang(next as LanguageCode)
 }

 if (collapsed) {
 return (
 <button
 onClick={toggleLang}
 className="nav-link group w-full flex items-center justify-center py-2 rounded-lg text-sidebar-muted hover:text-foreground hover:bg-sidebar-hover transition-all"
 title={lang === "en" ? "Switch to Thai" : "เปลี่ยนเป็นภาษาอังกฤษ"}
 >
 <Globe className="nav-icon w-4 h-4 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
 </button>
 )
 }

 return (
 <button
 onClick={toggleLang}
 className="nav-link group w-full flex items-center justify-between px-2 py-2 rounded-lg text-sidebar-muted hover:text-foreground hover:bg-sidebar-hover transition-all text-xs"
 >
 <div className="flex items-center gap-2">
 <Globe className="nav-icon w-4 h-4 transition-all duration-200 group-hover:scale-110 group-hover:-translate-y-0.5" />
 <span>{LANGUAGE_NAMES[lang]}</span>
 </div>
 <span className="text-[10px] opacity-60">{(lang === "en" ? "TH" : "EN")}</span>
 </button>
 )
}
