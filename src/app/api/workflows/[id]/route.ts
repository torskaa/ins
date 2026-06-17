import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const workflow = await prisma.workflowDefinition.findFirst({ where: { id, organizationId: org.id }, include: { states: true, transitions: { include: { fromState: true, toState: true } } } })
  if (!workflow) return NextResponse.json({ error: "Workflow not found" }, { status: 404 })
  return NextResponse.json(workflow)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const workflow = await prisma.workflowDefinition.update({ where: { id }, data: { name: body.name, isActive: body.isActive } })
  await logAudit({ action: "updated", entity: "WorkflowDefinition", entityId: id, message: `Workflow "${workflow.name}" updated`, organizationId: org.id })
  return NextResponse.json(workflow)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await prisma.workflowDefinition.delete({ where: { id, organizationId: org.id } })
  return NextResponse.json({ success: true })
})
