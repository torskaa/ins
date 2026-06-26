"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical, Trash2 } from "lucide-react"

interface BlockItemProps {
  id: string
  children: React.ReactNode
  onDelete: () => void
}

export function BlockItem({ id, children, onDelete }: BlockItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="group/block relative">
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute -left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity cursor-grab active:cursor-grabbing p-1 text-muted-foreground/30 hover:text-muted-foreground/60"
      >
        <GripVertical className="size-4" />
      </div>

      {/* Hover toolbar */}
      <div className="absolute -right-8 top-1/2 -translate-y-1/2 opacity-0 group-hover/block:opacity-100 transition-opacity flex items-center gap-0.5">
        <button
          type="button"
          onClick={onDelete}
          className="p-1 rounded text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>

      {children}
    </div>
  )
}
