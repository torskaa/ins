"use client"

import { useState, useCallback, useRef } from "react"
import type { UploadedFile } from "@/components/upload/upload-file-main"

export interface ImportAnalysisResult {
  success: boolean
  message: string
  items: Record<string, unknown>[]
}

export function useUploadImport(module: string) {
  const [files, setFiles] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [analysisResult, setAnalysisResult] = useState<ImportAnalysisResult | null>(null)
  const idCounter = useRef(0)

  const addFiles = useCallback((newFiles: File[]) => {
    const mapped: UploadedFile[] = newFiles.map((file) => ({
      id: `upload-${++idCounter.current}`,
      file,
      progress: 0,
      status: "uploading" as const,
    }))
    setFiles((prev) => [...prev, ...mapped])
    setAnalysisResult(null)

    mapped.forEach((f) => {
      simulateUpload(f.id, module)
    })
  }, [module])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }, [])

  const clearFiles = useCallback(() => {
    setFiles([])
    setAnalysisResult(null)
  }, [])

  function simulateUpload(fileId: string, mod: string) {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 30 + 5
      if (progress >= 100) {
        progress = 100
        clearInterval(interval)
        setFiles((prev) =>
          prev.map((f) =>
            f.id === fileId
              ? { ...f, progress: 100, status: "completed", validation: analyzeFile(f.file, mod) }
              : f,
          ),
        )
        setUploading(false)
      } else {
        setFiles((prev) =>
          prev.map((f) => (f.id === fileId ? { ...f, progress, status: "uploading" } : f)),
        )
        setUploading(true)
      }
    }, 300)
  }

  return { files, uploading, analysisResult, addFiles, removeFile, clearFiles, setAnalysisResult }
}

function analyzeFile(file: File, module: string): { valid: boolean; message: string } {
  const ext = file.name.split(".").pop()?.toLowerCase()

  if (!ext || !["csv", "xlsx", "xls", "json", "pdf"].includes(ext)) {
    return { valid: false, message: `Unsupported format (.${ext}). Use CSV, XLSX, JSON, or PDF.` }
  }

  const moduleChecks: Record<string, string> = {
    inventory: "All required fields present (SKU, name, price, stock, status). Ready for import.",
    materials: "All required fields present (name, unit, cost, category). Ready for import.",
    orders: "All required fields present (customer, items, total, status). Ready for import.",
    crm: "All required fields present (name, email, phone, company). Ready for import.",
    "knowledge/documents": "All required fields present (title, content, tags). Ready for import.",
    quotations: "All required fields present (items, pricing, valid until). Ready for import.",
    payments: "All required fields present (amount, date, method, reference). Ready for import.",
    invoices: "All required fields present (number, items, total, tax). Ready for import.",
    suppliers: "All required fields present (name, contact, payment terms). Ready for import.",
    "purchase-order": "All required fields present (supplier, items, delivery date). Ready for import.",
    bom: "All required fields present (product, components, quantities). Ready for import.",
    warehouses: "All required fields present (name, location, capacity). Ready for import.",
  }

  const check = moduleChecks[module]
  if (!check) return { valid: true, message: "File validated successfully." }

  return { valid: true, message: check }
}
