import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const program = await prisma.trainingProgram.findFirst({ where: { id, organizationId: org.id } })
  if (!program) return NextResponse.json({ error: "Program not found" }, { status: 404 })
  return NextResponse.json(program)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const program = await prisma.trainingProgram.update({ where: { id }, data: { title: body.title, type: body.type, level: body.level, modules: body.modules || 1, duration: body.duration, description: body.description } })
  return NextResponse.json(program)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  await prisma.trainingProgram.delete({ where: { id, organizationId: org.id } })
  return NextResponse.json({ success: true })
})
