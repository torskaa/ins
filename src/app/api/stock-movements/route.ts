import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async (request: Request) => {
  const { org } = await requireOrg()
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "50")
  const productId = searchParams.get("productId")
  const type = searchParams.get("type")
  const where: any = { organizationId: org.id }
  if (productId) where.productId = productId
  if (type) where.type = type
  const [movements, total] = await Promise.all([
    prisma.stockMovement.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit, take: limit,
      include: { product: { select: { id: true, name: true, sku: true } }, warehouse: { select: { id: true, name: true } } },
    }),
    prisma.stockMovement.count({ where }),
  ])
  return NextResponse.json({ movements, total, page, totalPages: Math.ceil(total / limit) })
})
