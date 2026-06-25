"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { useState, useMemo } from "react"
import { BarChart3, Code } from "lucide-react"
import type { Components } from "react-markdown"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts"
import { StatsWidget, detectStatsCards } from "@/components/ui/stats-widget"

interface MarkdownRendererProps {
  content: string
}

function isChartable(data: unknown): data is Record<string, unknown>[] {
  if (!Array.isArray(data) || data.length === 0) return false
  const numericKeys = new Set<string>()
  const labelKeys = new Set<string>()
  const keys = Object.keys(data[0])
  for (const key of keys) {
    const vals = data.map((d) => d[key])
    const isNumeric = vals.every((v) => typeof v === "number" || (typeof v === "string" && !isNaN(Number(v))))
    if (isNumeric) numericKeys.add(key)
    else labelKeys.add(key)
  }
  return numericKeys.size > 0 && (labelKeys.size > 0 || numericKeys.size >= 2)
}

function ChartBlock({ data, label }: { data: Record<string, unknown>[]; label?: string }) {
  const [view, setView] = useState<"chart" | "raw">("chart")

  const keys = Object.keys(data[0])
  const numericKeys = keys.filter((k) => data.every((d) => typeof d[k] === "number" || (typeof d[k] === "string" && !isNaN(Number(d[k])))))
  const labelKey = keys.find((k) => !numericKeys.includes(k)) || numericKeys[0]

  const rawJson = JSON.stringify(data, null, 2)

  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-muted/5">
        <span className="text-xs font-medium text-muted-foreground">{label || "Data"}</span>
        <button
          onClick={() => setView(view === "chart" ? "raw" : "chart")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {view === "chart" ? <Code className="size-3" /> : <BarChart3 className="size-3" />}
          {view === "chart" ? "Raw" : "Chart"}
        </button>
      </div>
      {view === "chart" ? (
        <div className="p-4">
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data as any[]} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.3} />
                <XAxis dataKey={labelKey} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--color-border)", fontSize: 12, background: "var(--color-card)" }} />
                {numericKeys.map((key, i) => (
                  <Bar key={key} dataKey={key} fill={["#3b82f6", "#22c55e", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4"][i % 6]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        <pre className="p-4 text-sm font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap">{rawJson}</pre>
      )}
    </div>
  )
}

function CodeBlock({ className, children, ...props }: React.ComponentPropsWithoutRef<"code"> & { className?: string }) {
  const match = /language-(\w+)/.exec(className || "")
  const language = match ? match[1] : ""
  const code = String(children).replace(/\n$/, "")

  const parsedJson = useMemo(() => {
    if (language !== "json") return null
    try { return JSON.parse(code) } catch { return null }
  }, [language, code])

  const chartData = useMemo(() => {
    if (!parsedJson) return null
    if (isChartable(parsedJson)) return parsedJson as Record<string, unknown>[]
    return null
  }, [parsedJson])

  const statsData = useMemo(() => {
    if (!parsedJson) return null
    return detectStatsCards(parsedJson)
  }, [parsedJson])

  if (statsData) {
    return <StatsWidget cards={statsData} />
  }

  if (chartData) {
    return <ChartBlock data={chartData} label={language} />
  }

  if (match) {
    return (
      <div className="rounded-xl border border-border overflow-hidden bg-muted/5">
        <pre className="p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">{code}</pre>
      </div>
    )
  }

  return (
    <code className="px-1.5 py-0.5 rounded-md bg-muted/20 text-sm font-mono text-foreground" {...props}>
      {children}
    </code>
  )
}

const components: Components = {
  code: CodeBlock as unknown as Components["code"],
  pre: ({ children }) => <div className="my-3">{children}</div>,
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed text-sm text-foreground">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-0.5">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-0.5">{children}</ol>,
  li: ({ children }) => <li className="text-sm leading-relaxed text-muted-foreground">{children}</li>,
  h1: ({ children }) => <h1 className="text-lg font-bold mb-3 mt-5 text-foreground">{children}</h1>,
  h2: ({ children }) => <h2 className="text-base font-bold mb-2 mt-4 text-foreground">{children}</h2>,
  h3: ({ children }) => <h3 className="text-sm font-semibold mb-1 mt-3 text-foreground">{children}</h3>,
  blockquote: ({ children }) => (
    <div className="rounded-xl border border-border/60 bg-muted/5 px-4 py-3 mb-3 border-l-2 border-l-info/50">
      <div className="text-sm text-muted-foreground [&>p]:mb-0">{children}</div>
    </div>
  ),
  table: ({ children }) => (
    <div className="rounded-xl border border-border overflow-hidden my-3">
      <div className="relative w-full overflow-auto">
        <table className="w-full text-sm caption-bottom">{children}</table>
      </div>
    </div>
  ),
  th: ({ children }) => (
    <th className="h-10 px-4 text-left align-middle font-medium text-muted-foreground border-b border-border bg-muted/5">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="p-3 align-middle text-sm border-b border-border last:border-0">
      {children}
    </td>
  ),
  a: ({ href, children }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80">
      {children}
    </a>
  ),
  hr: () => <hr className="my-4 border-border/20" />,
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="max-w-none">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
