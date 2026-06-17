import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [products, orders, bomPending, quotationPending] = await Promise.all([
    prisma.product.findMany({
      where: { organizationId: org.id, deletedAt: null },
      select: { id: true, name: true, sku: true, stock: true, minStock: true },
      orderBy: { stock: "asc" },
    }),
    prisma.order.findMany({
      where: { organizationId: org.id, status: { notIn: ["delivered", "cancelled"] } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, number: true, type: true, status: true, total: true },
    }),
    prisma.billOfMaterial.count({
      where: { organizationId: org.id, status: "submitted" },
    }),
    prisma.quotation.count({
      where: { organizationId: org.id, status: "draft", deletedAt: null },
    }),
  ])

  const lowStock = products.filter((p) => p.stock <= p.minStock)
  const revenueMonth = await prisma.order.aggregate({
    where: { organizationId: org.id, orderDate: { gte: thirtyDaysAgo }, status: "delivered" },
    _sum: { total: true },
  })

  return NextResponse.json({
    lowStock: lowStock.slice(0, 10),
    pendingOrders: orders,
    pendingApprovals: [
      { entity: "BOM", count: bomPending, link: "/bom" },
      { entity: "quotations", count: quotationPending, link: "/quotations" },
    ].filter((a) => a.count > 0),
    recentTransactions: [],
    supplierAlerts: [],
    metrics: {
      totalProducts: products.length,
      totalOrders: orders.length,
      revenueMonth: revenueMonth._sum.total || 0,
      lowStockCount: lowStock.length,
      pendingOrderCount: orders.length,
      pendingApprovalCount: bomPending + quotationPending,
    },
  })
})
