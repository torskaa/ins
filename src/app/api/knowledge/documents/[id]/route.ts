import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const doc = await prisma.knowledgeDocument.findFirst({ where: { id, organizationId: org.id } })
  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })
  return NextResponse.json(doc)
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const doc = await prisma.knowledgeDocument.update({ where: { id }, data: { name: body.name, type: body.type, fileType: body.fileType, size: body.size, notes: body.notes } })
  return NextResponse.json(doc)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  await prisma.knowledgeDocument.delete({ where: { id, organizationId: org.id } })
  return NextResponse.json({ success: true })
})
