"use client"

import * as React from "react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
 className,
 classNames,
 showOutsideDays = true,
 ...props
}: CalendarProps) {
 return (
 <DayPicker
 showOutsideDays={showOutsideDays}
 className={cn("w-full", className)}
 classNames={{
 months: "w-full",
 month: "w-full space-y-5",
 caption: "flex justify-center pt-1 relative items-center px-8",
 caption_label: "text-base font-semibold",
 nav: "space-x-1 flex items-center",
 nav_button: cn(
 buttonVariants({ variant: "outline" }),
 "h-9 w-9 bg-transparent p-0 opacity-60 hover:opacity-100",
 ),
 nav_button_previous: "absolute left-1",
 nav_button_next: "absolute right-1",
 table: "w-full",
 head_row: "grid grid-cols-7 w-full",
 head_cell:
 "text-muted-foreground font-medium text-xs py-2 text-center",
 row: "grid grid-cols-7 w-full",
 cell: cn(
 "relative p-0.5 text-center text-sm focus-within:relative focus-within:z-20 aspect-square [&:has([aria-selected])]:bg-accent [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected].day-range-end)]:rounded-r-md",
 props.mode === "range"
 ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
 : "[&:has([aria-selected])]:rounded-md",
 ),
 day: cn(
 buttonVariants({ variant: "ghost" }),
 "h-full w-full p-0 font-normal text-sm aria-selected:opacity-100 rounded-lg",
 ),
 day_range_start: "day-range-start",
 day_range_end: "day-range-end",
 day_selected:
 "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
 day_today: "bg-accent/40 text-accent-foreground font-semibold",
 day_outside:
 "day-outside text-muted-foreground/50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground",
 day_disabled: "text-muted-foreground/30 opacity-50",
 day_range_middle:
 "aria-selected:bg-accent aria-selected:text-accent-foreground",
 day_hidden: "invisible",
 ...classNames,
 }}
 {...props}
 />
 )
}
Calendar.displayName = "Calendar"

export { Calendar }
