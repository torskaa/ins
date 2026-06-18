"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
 DropdownMenu,
 DropdownMenuContent,
 DropdownMenuItem,
 DropdownMenuLabel,
 DropdownMenuSeparator,
 DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

export type MoreAction = {
 label: string
 icon?: ReactNode
 onClick?: () => void
 href?: string
}

export function MoreMenu({
 label = "More",
 actions,
}: {
 label?: string
 actions: (MoreAction | "separator")[]
}) {
 const router = useRouter()

 return (
 <DropdownMenu>
 <DropdownMenuTrigger asChild>
   <Button variant="outline" size="icon" className="size-9">
  <MoreVertical className="w-4 h-4" />
  </Button>
 </DropdownMenuTrigger>
 <DropdownMenuContent align="end" className="w-48">
 {actions.map((action, i) => {
 if (action === "separator") {
 return <DropdownMenuSeparator key={i} />
 }
 return (
 <DropdownMenuItem
 key={action.label}
 onClick={() => {
 if (action.href) router.push(action.href)
 action.onClick?.()
 }}
 className="text-sm gap-2"
 >
 {action.icon}
 {action.label}
 </DropdownMenuItem>
 )
 })}
 </DropdownMenuContent>
 </DropdownMenu>
 )
}

// Reusable action icon components
export const ActionIcons = {
 AddNew: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" /></svg>,
 ExportCSV: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 1a.75.75 0 01.75.75V8.5h6.75a.75.75 0 010 1.5h-6.75v6.75a.75.75 0 01-1.5 0V10H2.5a.75.75 0 010-1.5h6.75V1.75A.75.75 0 0110 1z" /></svg>,
 ExportPDF: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clipRule="evenodd" /></svg>,
 Refresh: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.201 2.466l-.312-.311h2.433a.75.75 0 000-1.5H3.989a.75.75 0 00-.75.75v4.242a.75.75 0 001.5 0v-2.43l.31.31a7 7 0 0011.712-3.138.75.75 0 00-1.449-.39zm1.23-3.723a.75.75 0 00.219-.53V2.929a.75.75 0 00-1.5 0V5.36l-.31-.31A7 7 0 003.239 8.188a.75.75 0 101.448.389A5.5 5.5 0 0113.89 6.11l.311.31h-2.432a.75.75 0 000 1.5h4.243a.75.75 0 00.53-.219z" clipRule="evenodd" /></svg>,
 ViewAll: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M7 3.5A1.5 1.5 0 018.5 2h3.879a1.5 1.5 0 011.06.44l3.122 3.12A1.5 1.5 0 0117 6.622V16.5a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 16.5v-13A1.5 1.5 0 014.5 2H7z" /></svg>,
 Print: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M5 2.75C5 1.784 5.784 1 6.75 1h6.5c.966 0 1.75.784 1.75 1.75v3.552c.377.046.738.13 1.078.248l.128.048A3.25 3.25 0 0118 9.72v5.03a1.75 1.75 0 01-1.75 1.75h-1.5a.75.75 0 01-.75-.75v-2.5H6v2.5a.75.75 0 01-.75.75h-1.5A1.75 1.75 0 012 14.75V9.72a3.25 3.25 0 012.794-3.222l.128-.048c.34-.118.7-.202 1.078-.248V2.75zm3.25 6.25h3.5a.75.75 0 000-1.5h-3.5a.75.75 0 000 1.5z" clipRule="evenodd" /></svg>,
 Share: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M13 4.5a2.5 2.5 0 11.702 1.737L6.97 9.604a2.518 2.518 0 010 .792l6.733 3.367a2.5 2.5 0 11-.671 1.341l-6.733-3.367a2.5 2.5 0 110-3.475l6.733-3.366A2.52 2.52 0 0113 4.5z" /></svg>,
 Settings: <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.498 6.498 0 011.958.973l1.582-.63a1 1 0 011.215.437l1.18 2.045a1 1 0 01-.153 1.277l-1.196 1.123c.066.424.103.86.103 1.306 0 .447-.037.882-.103 1.306l1.196 1.122a1 1 0 01.153 1.278l-1.18 2.045a1 1 0 01-1.215.437l-1.582-.63a6.498 6.498 0 01-1.958.973l-.331 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.498 6.498 0 01-1.958-.973l-1.582.63a1 1 0 01-1.215-.437l-1.18-2.045a1 1 0 01.153-1.278l1.196-1.122A6.993 6.993 0 012 10c0-.447.037-.882.103-1.306L.907 7.572a1 1 0 01-.153-1.277l1.18-2.045a1 1 0 011.215-.437l1.582.63a6.498 6.498 0 011.958-.973l.331-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" /></svg>,
}
