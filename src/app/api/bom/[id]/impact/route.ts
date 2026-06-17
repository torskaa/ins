import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async (_request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params
  const { org } = await requireOrg()

  const bom = await prisma.billOfMaterial.findFirst({ where: { id, organizationId: org.id } })
  if (!bom) return NextResponse.json({ error: "Not found" }, { status: 404 })

  const material = bom.materialId

  const affectedProducts = await prisma.billOfMaterial.findMany({
    where: { materialId: material, organizationId: org.id, status: { not: "archived" } },
    include: {
      finishedGood: { select: { id: true, name: true, sku: true } },
    },
  })

  const finishedGoodIds = affectedProducts.map((b) => b.finishedGoodId)

  const affectedOrders = await prisma.orderItem.findMany({
    where: {
      productId: { in: finishedGoodIds },
      order: { organizationId: org.id, status: { notIn: ["cancelled", "delivered"] } },
    },
    include: {
      order: { select: { id: true, number: true, status: true } },
    },
    take: 50,
  })

  const totalStock = await prisma.product.findMany({
    where: { id: { in: finishedGoodIds }, organizationId: org.id },
    select: { id: true, name: true, stock: true, unitPrice: true },
  })

  return NextResponse.json({
    material: { id: material, name: bom.materialId },
    affectedProducts: affectedProducts.map((b) => ({
      id: b.finishedGood.id,
      name: b.finishedGood.name,
      sku: b.finishedGood.sku,
      quantity: b.quantity,
    })),
    affectedOrders: affectedOrders.map((oi) => ({
      id: oi.order.id,
      number: oi.order.number,
      status: oi.order.status,
      quantity: oi.quantity,
    })),
    totalStock,
    summary: {
      totalProducts: finishedGoodIds.length,
      uniqueProducts: new Set(finishedGoodIds).size,
      pendingOrders: affectedOrders.length,
      totalStockValue: totalStock.reduce((sum, p) => sum + p.stock * p.unitPrice, 0),
    },
  })
})
