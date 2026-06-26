"use client"

import { useSession, signOut } from "next-auth/react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { abbreviateName } from "@/lib/utils"
import { LogOut, User, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ButtonColorful } from "@/components/ui/button-colorful"
import { CommandPalette } from "@/components/layout/command-palette"
import { NotificationBell } from "@/components/layout/notification-bell"
import { QuickCreate } from "@/components/layout/quick-create"

interface HeaderProps {
	onWorkspaceOpen?: () => void
}

export function Header({ onWorkspaceOpen }: HeaderProps) {
	const { data: session } = useSession()

	return (
		<header className="sticky top-0 z-30 h-14 border-b border-border bg-background/90 backdrop-blur-sm">
			<div className="flex items-center justify-between h-full px-6 lg:px-8">
				<div className="flex items-center gap-3 flex-1">
					<CommandPalette />
				</div>
				<div className="flex items-center gap-2">
					<div className="flex items-center gap-1.5 pr-2 border-r border-border/50">
						<ButtonColorful onClick={onWorkspaceOpen} className="h-8 gap-1.5 text-xs shadow-sm">
							Ask AI
						</ButtonColorful>
						<QuickCreate />
					</div>
					<div className="flex items-center gap-2">
						<NotificationBell />
						<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button className="group flex items-center gap-2 rounded-md p-1.5 hover:bg-surface transition-all duration-150">
								<p className="text-sm text-muted-foreground hidden sm:block transition-all duration-150 group-hover:text-foreground">{abbreviateName(session?.user?.name) || session?.user?.name}</p>
								<Avatar className="w-8 h-8 ring-1 ring-border/50 transition-all duration-150 group-hover:ring-primary/40 group-hover:ring-2">
									<AvatarImage src={session?.user?.image || `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(session?.user?.name || "User")}`} />
									<AvatarFallback className="bg-primary/10 text-primary text-xs transition-all duration-150 group-hover:bg-primary group-hover:text-white">
										{session?.user?.name?.[0] || "U"}
									</AvatarFallback>
								</Avatar>
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-48">
							<div className="px-3 py-2 border-b border-border/50">
								<p className="text-sm font-medium">{abbreviateName(session?.user?.name) || session?.user?.name}</p>
								<p className="text-xs text-muted-foreground">{session?.user?.email}</p>
							</div>
							<div className="p-1">
								<DropdownMenuItem asChild>
									<a href="/settings" className="flex items-center gap-2.5 text-sm">Profile</a>
								</DropdownMenuItem>
								<DropdownMenuItem asChild>
									<a href="/workspaces" className="flex items-center gap-2.5 text-sm">Workspace</a>
								</DropdownMenuItem>
							</div>
							<DropdownMenuSeparator />
							<div className="p-1">
								<DropdownMenuItem
									onClick={() => signOut({ callbackUrl: "/login" })}
									className="flex items-center gap-2.5 text-sm text-destructive"
								>
									<LogOut className="w-4 h-4" />
									Sign Out
								</DropdownMenuItem>
							</div>
						</DropdownMenuContent>
					</DropdownMenu>
					</div>
				</div>
			</div>
		</header>
	)
}
