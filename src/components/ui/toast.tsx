"use client"

import { Toaster as Sonner, toast as sonnerToast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
 return (
 <Sonner
 theme="light"
 className="toaster group"
 toastOptions={{
 classNames: {
 toast:
 "group toast bg-white text-black border-gray-200 shadow-lg",
 description: "text-gray-500",
 actionButton:
 "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
 cancelButton:
 "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
 },
 }}
 {...props}
 />
 )
}

export { Toaster }

// Backward compatibility — existing code still works
export function ToastProvider({ children }: { children: React.ReactNode }) {
 return <>{children}</>
}

export function useToast() {
 return {
 toast: ({ title, description, variant }: { title: string; description?: string; variant?: string }) => {
 switch (variant) {
 case "success":
 sonnerToast.success(title, { description })
 break
 case "error":
 sonnerToast.error(title, { description })
 break
 case "warning":
 sonnerToast.warning(title, { description })
 break
 default:
 sonnerToast(title, { description })
 break
 }
 },
 }
}
