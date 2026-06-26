import * as React from "react"

import { cn } from "@/lib/utils"

function Actions({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="actions"
      className={cn("flex items-center gap-1", className)}
      {...props}
    />
  )
}

function Action({
  className,
  label,
  ...props
}: React.ComponentProps<"button"> & { label: string }) {
  return (
    <button
      data-slot="action"
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center justify-center size-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-surface transition-colors outline-none",
        className,
      )}
      {...props}
    />
  )
}

export { Actions, Action }
