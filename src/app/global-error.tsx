"use client"

import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
 useEffect(() => { Sentry.captureException(error) }, [error])
 return (
 <html>
 <body className="min-h-screen flex items-center justify-center bg-background p-8">
 <div className="max-w-md text-center">
 <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
 <p className="text-muted-foreground mb-6">An unexpected error occurred. Our team has been notified.</p>
 <button onClick={reset} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark">
 Try again
 </button>
 </div>
 </body>
 </html>
 )
}
