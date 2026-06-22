import { NextResponse } from "next/server"
import { apiHandler, requireAuth, requireOrg } from "@/lib/middleware"
import { McpServer } from "@/ai/mcp"
import { DefaultContextBuilder } from "@/ai/context/types"
import type { JsonRpcRequest, JsonRpcResponse } from "@/ai/mcp/types"

const mcpServer = new McpServer()

export const GET = apiHandler(async () => {
  const tools = mcpServer.listTools()
  return NextResponse.json({ tools })
})

export const POST = apiHandler(async (req: Request) => {
  const { org, userId } = await requireOrg()

  const ctx = new DefaultContextBuilder().build({
    userId,
    organizationId: org.id,
    organizationSlug: org.slug,
    userRole: "admin",
    permissions: ["*"],
  })

  const body: JsonRpcRequest = await req.json()
  const response: JsonRpcResponse = await mcpServer.handleRequest(body, ctx)

  return NextResponse.json(response)
})
