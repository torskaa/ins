import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()
  const articles = await prisma.wikiArticle.findMany({
    where: { organizationId: org.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(articles.map((a) => ({ ...a, topics: JSON.parse(a.topics || "[]") })))
})

export const POST = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const body = await request.json()
  const article = await prisma.wikiArticle.create({
    data: {
      title: body.title,
      category: body.category || "Getting Started",
      subtitle: body.subtitle || "",
      excerpt: body.excerpt || "",
      topics: JSON.stringify(body.topics || []),
      coverImage: body.previewImage || null,
      notifySubscribers: body.notifySubscribers ?? true,
      scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : null,
      content: body.content || "",
      author: "Admin",
      updated: "just now",
      readTime: `${Math.max(1, Math.ceil(((body.content || "").length + (body.excerpt || "").length) / 500))} min`,
      organizationId: org.id,
    },
  })
  return NextResponse.json(article)
})
