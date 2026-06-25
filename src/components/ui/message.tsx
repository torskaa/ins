import * as React from "react"

import { cn } from "@/lib/utils"

function Message({
  className,
  from,
  ...props
}: React.ComponentProps<"div"> & { from: "user" | "assistant" }) {
  return (
    <div
      data-slot="message"
      data-from={from}
      className={cn(
        "flex flex-col gap-2",
        from === "assistant" ? "items-start" : "items-end",
        className,
      )}
      {...props}
    />
  )
}

function MessageContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="message-content"
      className={cn(
        "px-4 py-2.5 text-sm leading-relaxed",
        className,
      )}
      {...props}
    />
  )
}

export { Message, MessageContent }
