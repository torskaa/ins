"use client"

import * as React from "react"
import { UploadCloud, X, CheckCircle2, Trash2, AlertCircle, FileText } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export interface UploadedFile {
  id: string
  file: File
  progress: number
  status: "uploading" | "completed" | "error"
  validation?: { valid: boolean; message: string }
}

interface UploadFileMainProps {
  className?: string
  files: UploadedFile[]
  onFilesChange: (files: File[]) => void
  onFileRemove: (id: string) => void
  onClose?: () => void
  moduleLabel?: string
}

export const UploadFileMain = React.forwardRef<HTMLDivElement, UploadFileMainProps>(
  ({ className, files = [], onFilesChange, onFileRemove, onClose, moduleLabel = "files" }, ref) => {
    const [isDragging, setIsDragging] = React.useState(false)
    const fileInputRef = React.useRef<HTMLInputElement>(null)

    const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true) }
    const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false) }
    const handleDragOver = (e: React.DragEvent) => { e.preventDefault() }

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFiles = Array.from(e.dataTransfer.files)
      if (droppedFiles.length > 0) onFilesChange(droppedFiles)
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || [])
      if (selectedFiles.length > 0) onFilesChange(selectedFiles)
    }

    const formatFileSize = (bytes: number) => {
      if (bytes === 0) return "0 KB"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={cn("w-full bg-background rounded-xl border shadow-sm", className)}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 flex items-center justify-center rounded-full bg-muted">
                <UploadCloud className="w-6 h-6 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Upload {moduleLabel}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Select and upload the files of your choice
                </p>
              </div>
            </div>
            {onClose && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={onClose}>
                    <X className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
  <p className="text-sm font-medium">Close</p>
  <p className="text-background/70 text-xs leading-snug">
    Close the upload panel
  </p>
</TooltipContent>
              </Tooltip>
            )}
          </div>

          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "mt-6 border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center text-center transition-colors duration-200 cursor-pointer",
              isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/30 hover:border-primary/50",
            )}
          >
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleFileSelect} />
            <UploadCloud className="w-10 h-10 text-muted-foreground mb-4" />
            <p className="font-semibold text-foreground">Choose a file or drag & drop it here.</p>
            <p className="text-xs text-muted-foreground mt-1">
              Supported formats: CSV, XLSX, PDF, JSON
            </p>
            <Button variant="outline" size="sm" className="mt-4 pointer-events-none">
              Browse File
            </Button>
          </div>
        </div>

        {files.length > 0 && (
          <div className="px-6 pb-6">
            <div className="border-t pt-4">
              <p className="text-sm font-medium text-foreground mb-3">
                {files.length} file{files.length > 1 ? "s" : ""} selected
              </p>
              <ul className="space-y-3">
                <AnimatePresence>
                  {files.map((file) => (
                    <motion.li
                      key={file.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      layout
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="w-10 h-10 flex items-center justify-center rounded-md bg-muted text-sm font-bold text-muted-foreground shrink-0">
                          {file.file.name.split(".").pop()?.toUpperCase().substring(0, 3) || "FILE"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{file.file.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{formatFileSize(file.file.size)}</span>
                            <span>•</span>
                            <span className={file.status === "completed" ? "text-success" : file.status === "error" ? "text-destructive" : "text-primary"}>
                              {file.status === "uploading" ? "Uploading..." : file.status === "completed" ? "Completed" : file.status === "error" ? "Error" : "Pending"}
                            </span>
                          </div>
                          {file.status === "uploading" && <Progress value={file.progress} className="h-1.5 mt-1.5" />}
                          {file.status === "completed" && file.validation && (
                            <div className={cn(
                              "flex items-center gap-1.5 text-xs mt-1",
                              file.validation.valid ? "text-success" : "text-amber-500",
                            )}>
                              {file.validation.valid ? (
                                <CheckCircle2 className="size-3" />
                              ) : (
                                <AlertCircle className="size-3" />
                              )}
                              {file.validation.message}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        {file.status === "completed" && <CheckCircle2 className="w-5 h-5 text-success" />}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="rounded-full w-8 h-8" onClick={() => onFileRemove(file.id)}>
                              {file.status === "completed" ? <Trash2 className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs flex-col items-start gap-1 px-3 py-2 text-left" side="bottom">
  <p className="text-sm font-medium">Remove</p>
  <p className="text-background/70 text-xs leading-snug">
    Remove this file from the upload list
  </p>
</TooltipContent>
                        </Tooltip>
                      </div>
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            </div>
          </div>
        )}
      </motion.div>
    )
  },
)
UploadFileMain.displayName = "UploadFileMain"
