import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const workflows = await prisma.workflowDefinition.findMany({
    where: { organizationId: org.id },
    include: { states: true, transitions: { include: { fromState: true, toState: true } } },
    orderBy: { name: "asc" },
  })
  return NextResponse.json(workflows)
})

export const POST = apiHandler(async (request: Request) => {
  await requirePermission("settings", "create")
  const { org } = await requireOrg()
  const body = await request.json()
  const workflow = await prisma.workflowDefinition.create({
    data: { name: body.name, entityType: body.entityType, organizationId: org.id },
    include: { states: true, transitions: true },
  })
  await logAudit({ action: "created", entity: "WorkflowDefinition", entityId: workflow.id, message: `Workflow "${workflow.name}" created`, organizationId: org.id })
  return NextResponse.json(workflow)
})
