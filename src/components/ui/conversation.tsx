import * as React from "react"

import { cn } from "@/lib/utils"

function Conversation({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="conversation" className={cn(className)} {...props} />
}

function ConversationContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="conversation-content" className={cn("flex flex-col gap-6", className)} {...props} />
}

export { Conversation, ConversationContent }
