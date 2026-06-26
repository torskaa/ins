"use client"

import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"

interface ChecklistItem {
  id: string
  text: string
  checked: boolean
}

interface ChecklistBlockProps {
  items: ChecklistItem[]
  onChange: (items: ChecklistItem[]) => void
}

export function ChecklistBlock({ items, onChange }: ChecklistBlockProps) {
  function addItem() {
    const id = crypto.randomUUID?.() || Math.random().toString(36).slice(2)
    onChange([...items, { id, text: "", checked: false }])
  }

  function updateItem(id: string, updates: Partial<ChecklistItem>) {
    onChange(items.map((i) => (i.id === id ? { ...i, ...updates } : i)))
  }

  function removeItem(id: string) {
    onChange(items.filter((i) => i.id !== id))
  }

  function handleKeyDown(e: React.KeyboardEvent, index: number) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      addItem()
      return
    }
    if (e.key === "Backspace" && !items[index]?.text && items.length > 1) {
      removeItem(items[index].id)
    }
  }

  return (
    <div className="space-y-1">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2 group/item">
          <Checkbox
            checked={item.checked}
            onCheckedChange={(checked) => updateItem(item.id, { checked: !!checked })}
            className="shrink-0"
          />
          <Input
            value={item.text}
            onChange={(e) => updateItem(item.id, { text: e.target.value })}
            onKeyDown={(e) => handleKeyDown(e, i)}
            placeholder="List item..."
            className="h-8 border-none bg-transparent px-0 text-base focus-visible:ring-0 placeholder:text-muted-foreground/30"
          />
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="size-6 flex items-center justify-center rounded opacity-0 group-hover/item:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="size-3" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addItem}
        className="flex items-center gap-1.5 text-sm text-muted-foreground/40 hover:text-muted-foreground/70 transition-colors mt-1"
      >
        <Plus className="size-3.5" /> Add item
      </button>
    </div>
  )
}
