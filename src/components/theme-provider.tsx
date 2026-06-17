"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark"

const ThemeContext = createContext<{
 theme: Theme
 toggleTheme: () => void
 setTheme: (t: Theme) => void
}>({ theme: "light", toggleTheme: () => {}, setTheme: () => {} })

export function ThemeProvider({ children }: { children: ReactNode }) {
 const [theme, setThemeState] = useState<Theme>("light")
 const [mounted, setMounted] = useState(false)

 useEffect(() => {
 setMounted(true)
 const stored = localStorage.getItem("ins-theme") as Theme | null
 if (stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches)) {
 setThemeState("dark")
 document.documentElement.classList.add("dark")
 } else {
 document.documentElement.classList.remove("dark")
 }
 }, [])

 const setTheme = (t: Theme) => {
 setThemeState(t)
 localStorage.setItem("ins-theme", t)
 if (t === "dark") {
 document.documentElement.classList.add("dark")
 } else {
 document.documentElement.classList.remove("dark")
 }
 }

 const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

 if (!mounted) return <>{children}</>

 return (
 <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
 {children}
 </ThemeContext.Provider>
 )
}

export function useTheme() {
 return useContext(ThemeContext)
}
