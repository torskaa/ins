"use client"

import { useEffect, useState } from "react"
import {
  formatBytes,
  useFileUpload,
  type FileMetadata,
  type FileWithPreview,
} from "@/hooks/use-file-upload"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/reui/alert"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { CircleAlertIcon, ImageIcon, StarIcon, XIcon, ZoomInIcon } from "lucide-react"

interface ImageGalleryProps {
  maxFiles?: number
  maxSize?: number
  accept?: string
  multiple?: boolean
  className?: string
  selectable?: boolean
  defaultPrimary?: string
  onFilesChange?: (files: FileWithPreview[]) => void
  onPrimaryChange?: (fileId: string | null) => void
}

export function ImageGallery({
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024,
  accept = "image/*",
  multiple = true,
  className,
  selectable = false,
  defaultPrimary,
  onFilesChange,
  onPrimaryChange,
}: ImageGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [loadingImages, setLoadingImages] = useState<Record<string, boolean>>({})
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [primaryId, setPrimaryId] = useState<string | null>(defaultPrimary || null)

  const handleSetPrimary = (id: string) => {
    setPrimaryId(id)
    onPrimaryChange?.(id)
  }

  const [
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
  ] = useFileUpload({
    maxFiles,
    maxSize,
    accept,
    multiple,
    onFilesChange,
  })

  const isImage = (file: File | FileMetadata) => {
    const type = file instanceof File ? file.type : file.type
    return type.startsWith("image/")
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "u") {
        e.preventDefault()
        openFileDialog()
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [openFileDialog])

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "rounded-lg relative border border-dashed p-8 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50"
        )}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input {...getInputProps()} className="sr-only" />

        <div className="flex flex-col items-center gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-full",
              isDragging ? "bg-primary/10" : "bg-muted"
            )}
          >
            <ImageIcon className={cn("h-5 w-5", isDragging ? "text-primary" : "text-muted-foreground")} />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Upload images to gallery</h3>
            <p className="text-muted-foreground text-sm">
              Drag and drop images here or click to browse
            </p>
            <p className="text-muted-foreground text-xs">
              PNG, JPG, GIF up to {formatBytes(maxSize)} each (max {maxFiles}{" "}
              files)
            </p>
          </div>

          <Button size="sm" onClick={openFileDialog}>
            Select images <kbd className="ml-1.5 px-1.5 py-0.5 rounded border border-primary-foreground/20 text-[10px] font-mono bg-primary-foreground/10">⌘U</kbd>
          </Button>
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h4 className="text-sm font-medium">
              Gallery ({files.length}/{maxFiles})
            </h4>
            <div className="text-muted-foreground text-xs">
              Total: {formatBytes(files.reduce((acc, f) => acc + f.file.size, 0))}
            </div>
          </div>
          <Button onClick={clearFiles} variant="outline" size="sm">
            Clear all
          </Button>
        </div>
      )}

      {files.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {files.map((fileItem) => (
            <div key={fileItem.id} className="group/item relative aspect-square">
              {isImage(fileItem.file) && fileItem.preview ? (
                <>
                  {loadingImages[fileItem.id] !== false && (
                    <div className="bg-muted/50 rounded-lg absolute inset-0 flex items-center justify-center border">
                      <Spinner className="text-muted-foreground size-6" />
                    </div>
                  )}
                  <img
                    src={fileItem.preview}
                    alt={fileItem.file.name}
                    onLoad={() =>
                      setLoadingImages((prev) => ({ ...prev, [fileItem.id]: false }))
                    }
                    className={cn(
                      "rounded-lg h-full w-full border object-cover transition-all group-hover/item:scale-105",
                      loadingImages[fileItem.id] !== false ? "opacity-0" : "opacity-100"
                    )}
                  />

                  {selectable && primaryId === fileItem.id && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 rounded-md bg-amber-400 px-1.5 py-0.5 text-[10px] font-semibold text-amber-950 shadow-xs">
                      <StarIcon className="size-3 fill-amber-950" />
                      Display
                    </div>
                  )}
                </>
              ) : (
                <div className="bg-muted rounded-lg flex h-full w-full items-center justify-center border">
                  <ImageIcon className="text-muted-foreground h-8 w-8" />
                </div>
              )}

              <div className="bg-black/50 absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity group-hover/item:opacity-100">
                {selectable && (
                  <Button
                    onClick={() => handleSetPrimary(fileItem.id)}
                    variant="secondary"
                    size="icon"
                    className={cn("size-7", primaryId === fileItem.id && "bg-amber-400 hover:bg-amber-500")}
                    title={primaryId === fileItem.id ? "Display image" : "Set as display image"}
                  >
                    <StarIcon className={cn("opacity-80", primaryId === fileItem.id && "fill-amber-900 text-amber-900")} />
                  </Button>
                )}
                {fileItem.preview && (
                  <Button
                    onClick={() => {
                      setSelectedImage(fileItem.preview!)
                      setIsPreviewLoading(true)
                    }}
                    variant="secondary"
                    size="icon"
                    className="size-7"
                  >
                    <ZoomInIcon className="opacity-80" />
                  </Button>
                )}
                <Button
                  onClick={() => removeFile(fileItem.id)}
                  variant="secondary"
                  size="icon"
                  className="size-7"
                >
                  <XIcon className="opacity-80" />
                </Button>
              </div>

              <div className="rounded-b-lg absolute right-0 bottom-0 left-0 bg-black/70 p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
                <p className="truncate text-xs font-medium">{fileItem.file.name}</p>
                <p className="text-xs text-gray-300">{formatBytes(fileItem.file.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {errors.length > 0 && (
        <Alert variant="destructive" className="mt-5">
          <CircleAlertIcon />
          <AlertTitle>File upload error(s)</AlertTitle>
          <AlertDescription>
            {errors.map((error, index) => (
              <p key={index} className="last:mb-0">{error}</p>
            ))}
          </AlertDescription>
        </Alert>
      )}

      <Dialog
        open={!!selectedImage}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogContent className="[&_[data-slot=dialog-close]]:text-muted-foreground [&_[data-slot=dialog-close]]:hover:text-foreground [&_[data-slot=dialog-close]]:bg-background w-full border-none bg-transparent p-0 shadow-none sm:max-w-xl [&_[data-slot=dialog-close]]:-end-7 [&_[data-slot=dialog-close]]:-top-7 [&_[data-slot=dialog-close]]:size-7 [&_[data-slot=dialog-close]]:rounded-full">
          <DialogHeader className="sr-only">
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center">
            {selectedImage && (
              <>
                {isPreviewLoading && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner className="size-8 text-white" />
                  </div>
                )}
                <img
                  src={selectedImage}
                  alt="Preview"
                  onLoad={() => setIsPreviewLoading(false)}
                  className={cn(
                    "rounded-lg h-full w-auto object-contain transition-opacity duration-300",
                    isPreviewLoading ? "opacity-0" : "opacity-100"
                  )}
                />
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
