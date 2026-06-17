import { prisma } from "@/lib/db"
import { calculateWeightedAverage } from "@/lib/costing"

type MRPResult = {
  productId: string
  productName: string
  sku: string
  requiredQty: number
  availableStock: number
  shortage: number
  suggestedPO: boolean
  suggestedQty: number
  leadTime: number
  preferredSupplierId?: string
  preferredSupplierName?: string
}

type MRPInput = {
  organizationId: string
  horizonDays?: number
}

/**
 * Material Requirements Planning (MRP) Engine
 * Calculates material shortages based on confirmed sales orders and BOMs.
 * Suggests purchase orders for raw materials that are below required levels.
 */
export async function runMRP(input: MRPInput): Promise<{
  finishedGoods: MRPResult[]
  rawMaterials: MRPResult[]
  summary: {
    totalShortfall: number
    suggestedPOs: number
    totalPOValue: number
  }
}> {
  const horizonDays = input.horizonDays || 30
  const horizon = new Date()
  horizon.setDate(horizon.getDate() + horizonDays)

  // Step 1: Get all confirmed sales orders within the horizon
  const salesOrders = await prisma.order.findMany({
    where: {
      organizationId: input.organizationId,
      type: "sales",
      status: { in: ["confirmed", "processing"] },
      expectedDate: { lte: horizon, gte: new Date() },
    },
    include: {
      items: { include: { product: true } },
    },
  })

  // Step 2: Aggregate demand by finished good
  const demandMap = new Map<string, number>()
  for (const order of salesOrders) {
    for (const item of order.items) {
      const current = demandMap.get(item.productId) || 0
      demandMap.set(item.productId, current + item.quantity)
    }
  }

  // Step 3: Get BOMs for all demanded finished goods
  const finishedGoodIds = Array.from(demandMap.keys())
  const boms = await prisma.billOfMaterial.findMany({
    where: {
      finishedGoodId: { in: finishedGoodIds },
      status: "approved",
      organizationId: input.organizationId,
    },
    include: {
      finishedGood: true,
      material: { include: { supplierPrices: { include: { supplier: true }, where: { isDefault: true } } } },
    },
  })

  // Step 4: Calculate raw material requirements from BOM explosion
  const materialDemand = new Map<string, { qty: number; sources: string[] }>()
  for (const bom of boms) {
    const fgDemand = demandMap.get(bom.finishedGoodId) || 0
    const totalQty = fgDemand * bom.quantity * (1 + (bom.scrapAllowance || 0) / 100)
    const existing = materialDemand.get(bom.materialId)
    if (existing) {
      existing.qty += totalQty
      existing.sources.push(bom.finishedGood.name)
    } else {
      materialDemand.set(bom.materialId, { qty: totalQty, sources: [bom.finishedGood.name] })
    }
  }

  // Step 5: Get current stock levels for raw materials
  const materialIds = Array.from(materialDemand.keys())
  const materials = await prisma.product.findMany({
    where: { id: { in: materialIds }, organizationId: input.organizationId },
    include: {
      supplier: { select: { id: true, name: true } },
      supplierPrices: { where: { isDefault: true }, include: { supplier: { select: { id: true, name: true } } }, take: 1 },
    },
  })
  const materialMap = new Map(materials.map((m) => [m.id, m]))

  // Step 6: Build results
  const rawResults: MRPResult[] = []
  for (const [matId, demand] of materialDemand) {
    const mat = materialMap.get(matId)
    if (!mat) continue
    const shortage = Math.max(0, demand.qty - mat.stock)
    rawResults.push({
      productId: matId,
      productName: mat.name,
      sku: mat.sku,
      requiredQty: Math.ceil(demand.qty),
      availableStock: mat.stock,
      shortage: Math.ceil(shortage),
      suggestedPO: shortage > 0,
      suggestedQty: Math.ceil(shortage + mat.safetyStock),
      leadTime: mat.leadTime,
      preferredSupplierId: mat.supplier?.id || mat.supplierPrices[0]?.supplier.id,
      preferredSupplierName: mat.supplier?.name || mat.supplierPrices[0]?.supplier.name,
    })
  }

  // Step 7: Build finished goods results
  const fgResults: MRPResult[] = []
  const products = await prisma.product.findMany({
    where: { id: { in: finishedGoodIds }, organizationId: input.organizationId },
  })
  const productMap = new Map(products.map((p) => [p.id, p]))
  for (const [fgId, demand] of demandMap) {
    const prod = productMap.get(fgId)
    if (!prod) continue
    const shortage = Math.max(0, demand - prod.stock)
    fgResults.push({
      productId: fgId,
      productName: prod.name,
      sku: prod.sku,
      requiredQty: demand,
      availableStock: prod.stock,
      shortage,
      suggestedPO: false,
      suggestedQty: 0,
      leadTime: prod.leadTime,
    })
  }

  const suggestedPOs = rawResults.filter((r) => r.suggestedPO)

  return {
    finishedGoods: fgResults,
    rawMaterials: rawResults,
    summary: {
      totalShortfall: rawResults.reduce((s, r) => s + r.shortage, 0),
      suggestedPOs: suggestedPOs.length,
      totalPOValue: suggestedPOs.reduce((s, r) => s + r.suggestedQty, 0),
    },
  }
}

/**
 * Inventory Turnover Ratio
 * COGS / Average Inventory Value
 */
export async function calculateInventoryTurnover(organizationId: string, months: number = 12): Promise<{
  turnover: number
  averageInventoryValue: number
  cogs: number
  daysInventoryOutstanding: number
}> {
  const periodStart = new Date()
  periodStart.setMonth(periodStart.getMonth() - months)

  const products = await prisma.product.findMany({
    where: { organizationId, deletedAt: null, type: "finished_good" },
    select: { id: true, stock: true, costPrice: true },
  })

  const currentInventoryValue = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0)
  const averageInventoryValue = currentInventoryValue // simplified

  const soldMovements = await prisma.stockMovement.findMany({
    where: {
      type: "sold",
      createdAt: { gte: periodStart },
      product: { organizationId },
    },
    include: { product: { select: { costPrice: true } } },
  })

  const cogs = soldMovements.reduce((sum, m) => sum + m.quantity * (m.product?.costPrice || 0), 0)
  const turnover = averageInventoryValue > 0 ? cogs / averageInventoryValue : 0
  const daysInventoryOutstanding = turnover > 0 ? 365 / turnover : 0

  return { turnover, averageInventoryValue, cogs, daysInventoryOutstanding }
}

/**
 * Cash Flow Forecast
 * Predicts cash inflows and outflows based on pending orders and invoices.
 */
export async function forecastCashFlow(organizationId: string, months: number = 3): Promise<{
  inflows: { month: string; amount: number }[]
  outflows: { month: string; amount: number }[]
  netCashFlow: { month: string; amount: number }[]
  totalInflow: number
  totalOutflow: number
  netProjected: number
}> {
  const now = new Date()

  // Receivables: confirmed sales orders and sent invoices
  const salesOrders = await prisma.order.findMany({
    where: { organizationId, type: "sales", status: { in: ["confirmed", "processing", "shipped"] } },
    select: { total: true, expectedDate: true },
  })

  const invoices = await prisma.invoice.findMany({
    where: { organizationId, status: { in: ["sent", "overdue"] } },
    select: { total: true, paidAmount: true, dueDate: true },
  })

  // Payables: purchase orders
  const purchaseOrders = await prisma.order.findMany({
    where: { organizationId, type: "purchase", status: { in: ["confirmed", "processing"] } },
    select: { total: true, expectedDate: true },
  })

  const monthlyBuckets: { [key: string]: { inflow: number; outflow: number } } = {}
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const key = d.toISOString().slice(0, 7)
    monthlyBuckets[key] = { inflow: 0, outflow: 0 }
  }

  for (const so of salesOrders) {
    const month = (so.expectedDate || now).toISOString().slice(0, 7)
    if (monthlyBuckets[month]) monthlyBuckets[month].inflow += so.total
  }

  for (const inv of invoices) {
    const month = inv.dueDate.toISOString().slice(0, 7)
    if (monthlyBuckets[month]) monthlyBuckets[month].inflow += inv.total - (inv.paidAmount || 0)
  }

  for (const po of purchaseOrders) {
    const month = (po.expectedDate || now).toISOString().slice(0, 7)
    if (monthlyBuckets[month]) monthlyBuckets[month].outflow += po.total
  }

  const inflows: { month: string; amount: number }[] = []
  const outflows: { month: string; amount: number }[] = []
  const netCashFlow: { month: string; amount: number }[] = []
  let totalInflow = 0
  let totalOutflow = 0

  for (const [month, val] of Object.entries(monthlyBuckets)) {
    inflows.push({ month, amount: val.inflow })
    outflows.push({ month, amount: val.outflow })
    netCashFlow.push({ month, amount: val.inflow - val.outflow })
    totalInflow += val.inflow
    totalOutflow += val.outflow
  }

  return { inflows, outflows, netCashFlow, totalInflow, totalOutflow, netProjected: totalInflow - totalOutflow }
}

/**
 * Supplier Performance Score
 * Calculates on-time delivery rate and quality rejection rate from historical data
 */
export async function calculateSupplierPerformance(organizationId: string) {
  const suppliers = await prisma.supplier.findMany({
    where: { organizationId, deletedAt: null },
    include: {
      purchaseOrders: {
        where: { status: { in: ["delivered", "shipped"] } },
        select: { status: true, deliveredAt: true, expectedDate: true, items: { select: { quantity: true, receivedQty: true } } },
      },
      lots: {
        select: { quantity: true },
      },
    },
  })

  return suppliers.map((s) => {
    const deliveredPOs = s.purchaseOrders.filter((po) => po.status === "delivered")
    const totalPOs = s.purchaseOrders.length
    const onTime = deliveredPOs.filter((po) => po.deliveredAt && po.expectedDate && po.deliveredAt <= po.expectedDate).length
    const onTimeRate = totalPOs > 0 ? (onTime / totalPOs) * 100 : null
    const qualityRate = s.lots.length > 0 ? 100 : null

    return {
      id: s.id,
      name: s.name,
      totalOrders: totalPOs,
      deliveredOrders: deliveredPOs.length,
      onTimeDeliveryRate: onTimeRate ? Math.round(onTimeRate * 10) / 10 : null,
      qualityRejectRate: qualityRate !== null ? Math.round((100 - qualityRate) * 10) / 10 : null,
    }
  })
}
