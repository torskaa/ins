import { useCallback, useEffect, useRef, useState } from "react"

export interface FileMetadata {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export interface FileWithPreview {
  id: string
  file: File
  preview: string | null
  metadata?: FileMetadata
}

interface UseFileUploadOptions {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  initialFiles?: FileMetadata[]
  onFilesChange?: (files: FileWithPreview[]) => void
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

function metadataToFileWithPreview(meta: FileMetadata): FileWithPreview {
  const blob = new Blob([], { type: meta.type })
  const file = new File([blob], meta.name, { type: meta.type })
  Object.defineProperty(file, "size", { value: meta.size })
  return { id: meta.id, file, preview: meta.url, metadata: meta }
}

export function useFileUpload({
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024,
  accept = "image/*",
  multiple = true,
  initialFiles = [],
  onFilesChange,
}: UseFileUploadOptions = {}) {
  const [files, setFiles] = useState<FileWithPreview[]>(() =>
    initialFiles.map(metadataToFileWithPreview)
  )
  const [isDragging, setIsDragging] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)
  const revokeQueue = useRef<string[]>([])

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const arr = Array.from(newFiles)
    const errs: string[] = []
    const valid: File[] = []

    for (const file of arr) {
      if (file.size > maxSize) {
        errs.push(`${file.name} exceeds ${formatBytes(maxSize)}`)
        continue
      }
      if (accept !== "*" && accept) {
        const types = accept.split(",").map((t) => t.trim())
        const matches = types.some((t) => {
          if (t.endsWith("/*")) {
            const category = t.replace("/*", "")
            return file.type.startsWith(category)
          }
          return file.type === t
        })
        if (!matches) {
          errs.push(`${file.name} has unsupported type`)
          continue
        }
      }
      valid.push(file)
    }

    const existingCount = files.length
    const available = maxFiles - existingCount
    if (valid.length > available) {
      errs.push(`Only ${available} more file(s) allowed (max ${maxFiles})`)
    }

    const slice = valid.slice(0, available)
    const previews = slice.map((file) => {
      const id = crypto.randomUUID()
      const preview = file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null
      return { id, file, preview }
    })

    setErrors(errs)
    setFiles((prev) => {
      const next = [...prev, ...previews]
      onFilesChange?.(next)
      return next
    })
  }, [maxFiles, maxSize, accept, files.length, onFilesChange])

  const removeFile = useCallback((id: string) => {
    setFiles((prev) => {
      const removed = prev.find((f) => f.id === id)
      if (removed?.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(removed.preview)
      }
      const next = prev.filter((f) => f.id !== id)
      onFilesChange?.(next)
      return next
    })
  }, [onFilesChange])

  const clearFiles = useCallback(() => {
    for (const f of files) {
      if (f.preview?.startsWith("blob:")) {
        URL.revokeObjectURL(f.preview)
      }
    }
    setFiles([])
    onFilesChange?.([])
  }, [files, onFilesChange])

  const openFileDialog = useCallback(() => {
    if (!inputRef.current) {
      const input = document.createElement("input")
      input.type = "file"
      input.accept = accept
      input.multiple = multiple
      input.style.display = "none"
      input.addEventListener("change", (e) => {
        const target = e.target as HTMLInputElement
        if (target.files) addFiles(target.files)
        target.value = ""
      })
      document.body.appendChild(input)
      inputRef.current = input
    }
    inputRef.current.accept = accept
    inputRef.current.multiple = multiple
    inputRef.current.click()
  }, [accept, multiple, addFiles])

  const getInputProps = useCallback(() => ({
    type: "file" as const,
    accept,
    multiple,
    style: { display: "none" },
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(e.target.files)
      e.target.value = ""
    },
  }), [accept, multiple, addFiles])

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files)
  }, [addFiles])

  useEffect(() => {
    return () => {
      for (const url of revokeQueue.current) {
        URL.revokeObjectURL(url)
      }
      if (inputRef.current?.parentNode) {
        inputRef.current.parentNode.removeChild(inputRef.current)
      }
    }
  }, [])

  return [
    { files, isDragging, errors },
    {
      removeFile,
      clearFiles,
      handleDragEnter,
      handleDragLeave,
      handleDragOver,
      handleDrop,
      openFileDialog,
      getInputProps,
    },
  ] as const
}
