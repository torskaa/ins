"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Link2, Plus, Webhook, Database, RefreshCw, Trash2, CheckCircle2, XCircle } from "lucide-react"
import { toast } from "sonner"

const INTEGRATIONS = [
 {
 id: "shopify",
 name: "Shopify",
 description: "Sync products, orders, and inventory with your Shopify store.",
 icon: "🛍️",
 status: "disconnected"},
 {
 id: "woocommerce",
 name: "WooCommerce",
 description: "Connect your WooCommerce store for order and inventory sync.",
 icon: "🛒",
 status: "disconnected"},
 {
 id: "lazada",
 name: "Lazada",
 description: "Integrate with Lazada for multi-channel selling.",
 icon: "📦",
 status: "disconnected"},
 {
 id: "shoppee",
 name: "Shopee",
 description: "Sync your Shopee store orders and inventory.",
 icon: "🛵",
 status: "disconnected"},
 {
 id: "line",
 name: "LINE",
 description: "Send notifications and order updates via LINE messaging.",
 icon: "💬",
 status: "disconnected"},
 {
 id: "email",
 name: "SMTP Email",
 description: "Configure email sending for invoices, quotations, and notifications.",
 icon: "📧",
 status: "disconnected"},
]

export default function IntegrationPage() {
 const [integrations, setIntegrations] = useState(INTEGRATIONS)

 function toggleIntegration(id: string) {
 setIntegrations((prev) =>
 prev.map((i) =>
 i.id === id
 ? { ...i, status: i.status === "connected" ? "disconnected" : "connected" }
 : i
 )
 )
 const integration = integrations.find((i) => i.id === id)
 const newStatus = integration?.status === "connected" ? "disconnected" : "connected"
 toast.success(`${integration?.name} ${newStatus === "connected" ? "connected" : "disconnected"}`)
 }

 return (
 <div className="animate-fade-in">
 <div className="page-header">
 <div><h1>Integration</h1><p>Connect your workspace with external services</p></div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {integrations.map((integration) => (
 <Card key={integration.id} className="hover:shadow-md transition-shadow">
 <CardHeader>
 <CardTitle className="flex items-center gap-2 text-base">
 <span className="text-lg">{integration.icon}</span>
 {integration.name}
 null
 </CardTitle>
 </CardHeader>
 <CardContent>
 <p className="text-sm text-muted-foreground mb-4">{integration.description}</p>
 <Button
 variant={integration.status === "connected" ? "outline" : "default"}
 className="w-full gap-1.5"
 onClick={() => toggleIntegration(integration.id)}
 >
 {integration.status === "connected" ? (
 <>Disconnect</>
 ) : (
 <>Connect</>
 )}
 </Button>
 </CardContent>
 </Card>
 ))}
 </div>
 </div>
 )
}
