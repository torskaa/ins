import { prisma } from "@/lib/db"

type CostResult = {
  costPrice: number
  lotId?: string
  remainingQty: number
}

/**
 * FIFO Cost Engine
 * Calculates cost of goods sold using First-In-First-Out method
 * based on Lot receipt history.
 */
export async function calculateFIFOCost(
  productId: string,
  quantity: number,
  organizationId: string
): Promise<{ lots: CostResult[]; totalCost: number; remainingQty: number }> {
  const lots = await prisma.lot.findMany({
    where: {
      productId,
      organizationId,
      quantity: { gt: 0 },
    },
    orderBy: { receivedDate: "asc" },
  })

  let remaining = quantity
  const results: CostResult[] = []

  for (const lot of lots) {
    if (remaining <= 0) break
    const take = Math.min(lot.quantity, remaining)
    results.push({
      costPrice: lot.costPrice || 0,
      lotId: lot.id,
      remainingQty: lot.quantity - take,
    })
    remaining -= take
  }

  if (remaining > 0) {
    throw new Error(
      `Insufficient lot quantity for product ${productId}: need ${quantity}, available ${quantity - remaining}`
    )
  }

  const totalCost = results.reduce((sum, r) => sum + r.costPrice * (r.remainingQty === 0 ? quantity - results.reduce((s, r2, i) => s + (i < results.indexOf(r) ? r2.remainingQty : 0), 0) : quantity), 0)

  return { lots: results, totalCost, remainingQty: remaining }
}

/**
 * Weighted Average Cost Calculator
 * Calculates the weighted average cost based on current lot inventory.
 */
export async function calculateWeightedAverage(
  productId: string,
  organizationId: string
): Promise<{ averageCost: number; totalStock: number; totalValue: number }> {
  const lots = await prisma.lot.findMany({
    where: {
      productId,
      organizationId,
      quantity: { gt: 0 },
    },
  })

  const totalStock = lots.reduce((sum, lot) => sum + lot.quantity, 0)
  const totalValue = lots.reduce((sum, lot) => sum + (lot.costPrice || 0) * lot.quantity, 0)
  const averageCost = totalStock > 0 ? totalValue / totalStock : 0

  return { averageCost, totalStock, totalValue }
}

/**
 * Cost Snapshot
 * Captures the cost at a moment in time and links it to an order/item.
 */
export async function snapshotCosts(
  orderId: string,
  organizationId: string
): Promise<void> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  })
  if (!order) throw new Error("Order not found")

  for (const item of order.items) {
    const wac = await calculateWeightedAverage(item.productId, organizationId)
    await prisma.activityLog.create({
      data: {
        action: "created",
        entity: "Order",
        entityId: orderId,
        message: `Cost snapshot for ${item.product.name} (${item.product.sku}): WAC=${wac.averageCost}, qty=${item.quantity}`,
        metadata: JSON.stringify({
          productId: item.productId,
          productName: item.product.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.total,
          weightedAverageCost: wac.averageCost,
          totalStockValue: wac.totalValue,
          totalStock: wac.totalStock,
          snapshotType: "order_cost",
        }),
        organizationId,
      },
    })
  }
}

/**
 * Record Lot Receipt
 * Creates a new lot entry when stock is received.
 */
export async function recordLotReceipt(
  data: {
    number: string
    productId: string
    supplierId?: string
    quantity: number
    costPrice?: number
    receivedDate?: Date
    expiryDate?: Date
    notes?: string
  },
  organizationId: string
) {
  return prisma.lot.create({
    data: {
      number: data.number,
      productId: data.productId,
      supplierId: data.supplierId,
      quantity: data.quantity,
      costPrice: data.costPrice,
      receivedDate: data.receivedDate || new Date(),
      expiryDate: data.expiryDate,
      notes: data.notes,
      organizationId,
    },
  })
}
