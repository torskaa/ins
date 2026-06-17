import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg, logAudit } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const tasks = await prisma.task.findMany({ where: { projectId: id, organizationId: org.id, deletedAt: null }, orderBy: { createdAt: "desc" } })
  return NextResponse.json(tasks)
})

export const POST = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id: projectId } = await params
  const body = await request.json()
  const task = await prisma.task.create({
    data: { title: body.title, description: body.description, priority: body.priority || "medium", assigneeId: body.assigneeId || null, dueDate: body.dueDate ? new Date(body.dueDate) : null, estimatedHours: parseFloat(body.estimatedHours) || 0, projectId, organizationId: org.id },
  })
  await logAudit({ action: "created", entity: "Task", entityId: task.id, message: `Task "${task.title}" created`, organizationId: org.id })
  return NextResponse.json(task)
})
