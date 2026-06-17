import { NextResponse } from "next/server"
import { apiHandler, requireOrg } from "@/lib/middleware"
import { prisma } from "@/lib/db"
import { calculateInventoryTurnover, forecastCashFlow } from "@/lib/enterprise"

async function getLowStockCount(orgId: string) {
  const products = await prisma.product.findMany({
    where: { organizationId: orgId, deletedAt: null },
    select: { stock: true, minStock: true },
  })
  return products.filter((p) => p.stock <= p.minStock).length
}

export const GET = apiHandler(async () => {
  const { org } = await requireOrg()

  const [
    totalProducts,
    lowStockCount,
    totalOrders,
    totalCustomers,
    totalSuppliers,
    totalRevenue,
    recentOrders,
    turnover,
    cashflow,
  ] = await Promise.all([
    prisma.product.count({ where: { organizationId: org.id, deletedAt: null, status: "active" } }),
    getLowStockCount(org.id),
    prisma.order.count({ where: { organizationId: org.id } }),
    prisma.customer.count({ where: { organizationId: org.id, deletedAt: null } }),
    prisma.supplier.count({ where: { organizationId: org.id, deletedAt: null } }),
    prisma.order.aggregate({ where: { organizationId: org.id, status: "delivered" }, _sum: { total: true } }),
    prisma.order.findMany({
      where: { organizationId: org.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: { select: { name: true } }, items: { include: { product: { select: { name: true } } } } },
    }),
    calculateInventoryTurnover(org.id),
    forecastCashFlow(org.id, 3),
  ])

  return NextResponse.json({
    totalProducts: totalProducts || 0,
    lowStockProducts: lowStockCount,
    totalOrders: totalOrders || 0,
    totalCustomers: totalCustomers || 0,
    totalSuppliers: totalSuppliers || 0,
    totalRevenue: totalRevenue._sum.total || 0,
    recentOrders: recentOrders || [],
    turnover: turnover || { turnover: 0, averageInventoryValue: 0, cogs: 0, daysInventoryOutstanding: 0 },
    cashflow: cashflow || { inflows: [], outflows: [], netCashFlow: [], totalInflow: 0, totalOutflow: 0, netProjected: 0 },
  })
})
