import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const project = await prisma.project.findFirst({ where: { id, organizationId: org.id, deletedAt: null }, include: { tasks: { orderBy: { createdAt: "desc" } } } })
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 })
  return NextResponse.json(project)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const data: any = { name: body.name, description: body.description, priority: body.priority, status: body.status, budget: parseFloat(body.budget) || 0 }
  if (body.startDate) data.startDate = new Date(body.startDate)
  if (body.dueDate) data.dueDate = new Date(body.dueDate)
  if (body.status === "completed") data.completedDate = new Date()
  const project = await prisma.project.update({ where: { id }, data })
  await logAudit({ action: "updated", entity: "Project", entityId: id, message: `Project "${project.name}" updated`, organizationId: org.id })
  return NextResponse.json(project)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await withSoftDelete(prisma.project, id, org.id)
  await logAudit({ action: "deleted", entity: "Project", entityId: id, message: "Project deleted", organizationId: org.id })
  return NextResponse.json({ success: true })
})
