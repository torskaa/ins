"use client"

import { useState } from "react"
import {
  BotMessageSquare,
  CopyIcon,
  RefreshCcwIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  User,
  Pencil,
  Check,
  X,
} from "lucide-react"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Message, MessageContent } from "@/components/ui/message"
import { Actions } from "@/components/ui/actions"
import { Badge } from "@/components/ui/badge"
import { MarkdownRenderer } from "@/components/ui/markdown-renderer"

export interface MessageAction {
  id: string
  icon: React.ReactNode
  label: string
  onClick?: () => void
  active?: boolean
}

export interface CopilotUserMessageProps {
  content: string
  avatarUrl?: string | null
  userName?: string | null
  onEdit?: (newContent: string) => void
}

export function CopilotUserMessage({ content, avatarUrl, userName, onEdit }: CopilotUserMessageProps) {
  const [editing, setEditing] = useState(false)
  const [editValue, setEditValue] = useState(content)

  function handleSave() {
    if (editValue.trim() && editValue !== content) {
      onEdit?.(editValue)
    }
    setEditing(false)
  }

  function handleCancel() {
    setEditValue(content)
    setEditing(false)
  }

  return (
    <Message from="user">
      <Avatar className="h-8 w-8">
        <AvatarImage src={avatarUrl || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(userName || "User")}`} alt={userName || "User"} />
        <AvatarFallback>
          <User className="size-4" />
        </AvatarFallback>
      </Avatar>
      {editing ? (
        <div className="flex-1 max-w-[85%] space-y-2">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="w-full rounded-2xl rounded-tr-md bg-muted/20 px-4 py-2.5 text-sm text-foreground resize-none border border-border/30 focus:border-ring/50 focus:ring-1 focus:ring-ring/30 outline-none"
            rows={3}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSave() }
              if (e.key === "Escape") handleCancel()
            }}
          />
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="h-7 text-xs gap-1" onClick={handleSave}>
              <Check className="size-3.5" />
              Save
            </Button>
            <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-muted-foreground" onClick={handleCancel}>
              <X className="size-3.5" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <MessageContent className="max-w-[85%] rounded-2xl rounded-tr-md border border-border text-foreground group relative">
          {content}
          {onEdit && (
            <button
              onClick={() => { setEditValue(content); setEditing(true) }}
              className="absolute -top-2 -right-2 size-6 rounded-full bg-card border border-border/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-surface"
            >
              <Pencil className="size-3 text-muted-foreground" />
            </button>
          )}
        </MessageContent>
      )}
    </Message>
  )
}

export interface CopilotAssistantMessageProps {
  content: string
  timestamp?: Date
  messageId?: string
  actions?: MessageAction[]
  onRetry?: () => void
  streaming?: boolean
  tag?: string | null
}

function getAgentAvatar(name?: string | null): string {
  const seed = name?.replace(/\s+/g, "") || "AI"
  return `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(seed)}`
}

export function CopilotAssistantMessage({ content, timestamp, actions, onRetry, streaming, tag }: CopilotAssistantMessageProps) {
  const [feedback, setFeedback] = useState<"like" | "dislike" | null>(null)

  const defaultActions: MessageAction[] = [
    ...(onRetry
      ? [{ id: "retry", icon: <RefreshCcwIcon className="size-3.5" />, label: "Retry", onClick: onRetry }]
      : []),
    {
      id: "like",
      icon: <ThumbsUpIcon className="size-3.5" />,
      label: feedback === "like" ? "Liked" : "Like",
      onClick: () => setFeedback(feedback === "like" ? null : "like"),
      active: feedback === "like",
    },
    {
      id: "dislike",
      icon: <ThumbsDownIcon className="size-3.5" />,
      label: feedback === "dislike" ? "Disliked" : "Dislike",
      onClick: () => setFeedback(feedback === "dislike" ? null : "dislike"),
      active: feedback === "dislike",
    },
    {
      id: "copy",
      icon: <CopyIcon className="size-3.5" />,
      label: "Copy",
      onClick: () => navigator.clipboard.writeText(content),
    },
    {
      id: "share",
      icon: <ShareIcon className="size-3.5" />,
      label: "Share",
      onClick: () => {
        if (navigator.share) {
          navigator.share({ text: content })
        }
      },
    },
  ]

  const mergedActions = actions ?? defaultActions

  return (
    <Message from="assistant">
      <div className="flex items-center gap-1.5">
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage src={getAgentAvatar(tag)} alt={tag || "AI"} />
          <AvatarFallback className="bg-gradient-to-br from-success/20 to-success/10 text-success">
            <BotMessageSquare className="size-4" />
          </AvatarFallback>
        </Avatar>
        {tag && (
          <Badge variant="outline" className="text-xs font-medium px-2 py-0.5 text-muted-foreground/50 border-border/40">
            {tag}
          </Badge>
        )}
      </div>
      <MessageContent className="rounded-2xl rounded-tl-md text-foreground">
        {content ? (
          <MarkdownRenderer content={content} />
        ) : null}
      </MessageContent>
      <Actions className="mt-1">
        {mergedActions.map((action) => (
          <Button
            key={action.id}
            variant="ghost"
            size="icon-sm"
            onClick={action.onClick}
            title={action.label}
            aria-label={action.label}
            data-active={action.active ? "true" : undefined}
          >
            {action.icon}
          </Button>
        ))}
      </Actions>
      {timestamp && (
        <p className="text-[11px] text-muted-foreground/60 ml-1 mt-0.5">
          {new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      )}
    </Message>
  )
}

export function CopilotLoadingDots() {
  return (
    <Message from="assistant">
      <Avatar className="h-8 w-8">
        <AvatarImage src={getAgentAvatar()} alt="AI" />
        <AvatarFallback className="bg-gradient-to-br from-success/20 to-success/10 text-success">
          <BotMessageSquare className="size-4" />
        </AvatarFallback>
      </Avatar>
      <MessageContent className="rounded-2xl rounded-tl-md" />
    </Message>
  )
}


