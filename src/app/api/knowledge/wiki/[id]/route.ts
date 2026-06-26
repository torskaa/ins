import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const article = await prisma.wikiArticle.findFirst({ where: { id, organizationId: org.id } })
  if (!article) return NextResponse.json({ error: "Article not found" }, { status: 404 })
  return NextResponse.json({ ...article, topics: JSON.parse(article.topics || "[]") })
})

export const PUT = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  const body = await request.json()
  const article = await prisma.wikiArticle.update({ where: { id }, data: { title: body.title, category: body.category, excerpt: body.excerpt, content: body.content, updated: "just now", readTime: `${Math.max(1, Math.ceil((body.content || "").length / 500))} min` } })
  return NextResponse.json(article)
})

export const DELETE = apiHandler(async (request: Request, { params }: any) => {
  const { org } = await requireOrg()
  const { id } = await params
  await prisma.wikiArticle.delete({ where: { id, organizationId: org.id } })
  return NextResponse.json({ success: true })
})
