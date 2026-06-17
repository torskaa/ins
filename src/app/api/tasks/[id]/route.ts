import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, requirePermission, logAudit, withSoftDelete } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const task = await prisma.task.findFirst({ where: { id, organizationId: org.id, deletedAt: null } })
  if (!task) return NextResponse.json({ error: "Task not found" }, { status: 404 })
  return NextResponse.json(task)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "update")
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const data: any = { title: body.title, description: body.description, status: body.status, priority: body.priority, assigneeId: body.assigneeId, estimatedHours: parseFloat(body.estimatedHours) || 0, actualHours: parseFloat(body.actualHours) || 0 }
  if (body.dueDate) data.dueDate = new Date(body.dueDate)
  const task = await prisma.task.update({ where: { id }, data })
  await logAudit({ action: "updated", entity: "Task", entityId: id, message: `Task "${task.title}" updated`, organizationId: org.id })
  return NextResponse.json(task)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  await requirePermission("settings", "delete")
  const { org } = await requireOrg()
  const { id } = await params
  await withSoftDelete(prisma.task, id, org.id)
  return NextResponse.json({ success: true })
})
