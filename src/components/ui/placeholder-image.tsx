import { cn } from "@/lib/utils"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

const fallbackColors = [
  "bg-gradient-to-br from-blue-400/20 to-blue-600/20 text-blue-600",
  "bg-gradient-to-br from-purple-400/20 to-purple-600/20 text-purple-600",
  "bg-gradient-to-br from-emerald-400/20 to-emerald-600/20 text-emerald-600",
  "bg-gradient-to-br from-amber-400/20 to-amber-600/20 text-amber-600",
  "bg-gradient-to-br from-rose-400/20 to-rose-600/20 text-rose-600",
  "bg-gradient-to-br from-cyan-400/20 to-cyan-600/20 text-cyan-600",
  "bg-gradient-to-br from-indigo-400/20 to-indigo-600/20 text-indigo-600",
  "bg-gradient-to-br from-teal-400/20 to-teal-600/20 text-teal-600",
]

function getColor(text: string) {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash)
  }
  return fallbackColors[Math.abs(hash) % fallbackColors.length]
}

function getInitials(text: string): string {
  return text
    .split(/\s+/)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

interface PlaceholderImageProps {
  name: string
  className?: string
  icon?: React.ReactNode
}

export function PlaceholderImage({ name, className, icon }: PlaceholderImageProps) {
  return (
    <Avatar
      className={cn("rounded-lg border border-border/60 shrink-0", className)}
      title={name}
    >
      <AvatarImage src={icon ? undefined : `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(name)}`} alt={name} />
      <AvatarFallback className={cn("rounded-lg font-semibold tracking-wide text-lg", getColor(name))}>
        {icon || getInitials(name)}
      </AvatarFallback>
    </Avatar>
  )
}
