"use client"

import React, { useState } from "react"
import {
  BotMessageSquare,
  CopyIcon,
  RefreshCcwIcon,
  ShareIcon,
  ThumbsDownIcon,
  ThumbsUpIcon,
  User,
} from "lucide-react"

import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Message, MessageContent } from "@/components/ui/message"
import { Actions } from "@/components/ui/actions"
import { AiLoader } from "@/components/ai/ai-loader"

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
}

export function CopilotUserMessage({ content, avatarUrl, userName }: CopilotUserMessageProps) {
  return (
    <Message from="user">
      <Avatar className="h-8 w-8">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={userName || "User"} />
        ) : (
          <AvatarFallback>
            <User className="size-4" />
          </AvatarFallback>
        )}
      </Avatar>
      <MessageContent className="max-w-[85%] rounded-2xl rounded-tr-md bg-primary text-primary-foreground">
        {content}
      </MessageContent>
    </Message>
  )
}

export interface CopilotAssistantMessageProps {
  content: string
  timestamp?: Date
  messageId?: string
  actions?: MessageAction[]
  onRetry?: () => void
}

export function CopilotAssistantMessage({ content, timestamp, actions, onRetry }: CopilotAssistantMessageProps) {
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
      <Avatar className="h-8 w-8">
        <AvatarFallback className="bg-gradient-to-br from-success/20 to-success/10 text-success">
          <BotMessageSquare className="size-4" />
        </AvatarFallback>
      </Avatar>
      <MessageContent className="max-w-[85%] rounded-2xl rounded-tl-md bg-card border border-border/60 text-foreground shadow-sm">
        <p className="whitespace-pre-wrap">{content}</p>
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
        <AvatarFallback className="bg-gradient-to-br from-success/20 to-success/10 text-success">
          <BotMessageSquare className="size-4" />
        </AvatarFallback>
      </Avatar>
      <MessageContent className="rounded-2xl rounded-tl-md bg-card border border-border/60 shadow-sm">
        <AiLoader variant="dots" />
      </MessageContent>
    </Message>
  )
}
