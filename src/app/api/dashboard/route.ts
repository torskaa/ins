import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { apiHandler, requireOrg } from "@/lib/middleware"

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const [
    totalProducts,
    allProducts,
    totalOrders,
    pendingOrders,
    totalCustomers,
    totalRevenue,
    recentOrders,
  ] = await Promise.all([
    prisma.product.count({ where: { organizationId: org.id, deletedAt: null, status: "active" } }),
    prisma.product.findMany({
      where: { organizationId: org.id, deletedAt: null },
      select: { id: true, name: true, sku: true, stock: true, minStock: true, status: true },
    }),
    prisma.order.count({ where: { organizationId: org.id } }),
    prisma.order.count({ where: { organizationId: org.id, status: { in: ["confirmed", "processing"] } } }),
    prisma.customer.count({ where: { organizationId: org.id, deletedAt: null } }),
    prisma.order.aggregate({ where: { organizationId: org.id, status: "delivered" }, _sum: { total: true } }),
    prisma.order.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    }),
  ])

  const lowStockProducts = allProducts.filter((p) => p.stock <= p.minStock).length
  const stockAlerts = allProducts
    .filter((p) => p.stock <= p.minStock)
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 5)

  return NextResponse.json({
    totalProducts: totalProducts || 0,
    lowStockProducts,
    totalOrders: totalOrders || 0,
    pendingOrders: pendingOrders || 0,
    totalCustomers: totalCustomers || 0,
    totalRevenue: totalRevenue._sum.total || 0,
    recentOrders: recentOrders || [],
    stockAlerts,
  })
})
