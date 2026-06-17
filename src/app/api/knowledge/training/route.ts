import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const programs = await prisma.trainingProgram.findMany({ where: { organizationId: org.id }, orderBy: { createdAt: "desc" } })
  return NextResponse.json(programs)
})

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const body = await request.json()
  const program = await prisma.trainingProgram.create({
    data: { title: body.title, type: body.type || "Course", level: body.level || "Beginner", modules: body.modules || 1, duration: body.duration || "1 hour", description: body.description || "", organizationId: org.id },
  })
  return NextResponse.json(program)
})
