"use client"

import { Component, type ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertTriangle } from "lucide-react"

interface Props {
 children: ReactNode
 fallback?: ReactNode
}

interface State {
 hasError: boolean
 error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
 constructor(props: Props) {
 super(props)
 this.state = { hasError: false }
 }

 static getDerivedStateFromError(error: Error): State {
 return { hasError: true, error }
 }

 render() {
 if (this.state.hasError) {
 return this.props.fallback || (
 <Card className="mx-auto mt-8 max-w-md">
 <CardContent className="p-8 text-center">
 <AlertTriangle className="w-8 h-8 text-destructive mx-auto mb-3" />
 <h2 className="text-lg font-semibold mb-1">Something went wrong</h2>
 <p className="text-sm text-muted-foreground mb-4">
 {this.state.error?.message || "An unexpected error occurred"}
 </p>
 <Button
 variant="secondary"
 size="sm"
 onClick={() => { this.setState({ hasError: false }); window.location.reload() }}
 className="gap-1.5"
 >
 Reload
 </Button>
 </CardContent>
 </Card>
 )
 }
 return this.props.children
 }
}
