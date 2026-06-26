import { NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { requireOrg } from "@/lib/middleware"

export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  try {
    const { org } = await requireOrg()

    const { searchParams } = new URL(request.url)
    const q = (searchParams.get("q") || "").trim()
    if (!q) return NextResponse.json({ products: [], customers: [], invoices: [], orders: [], suppliers: [], categories: [], quotations: [], payments: [], warehouses: [], documents: [], training: [], wiki: [], distributors: [], deliveries: [], stockCounts: [] })

    const [products, customers, invoices, orders, suppliers, categories, quotations, payments, warehouses, distributors, deliveries, stockCounts] = await Promise.all([
      prisma.product.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ name: { contains: q } }, { sku: { contains: q } }] },
        select: { id: true, name: true, sku: true, type: true, image: true },
        take: 5,
      }),
      prisma.customer.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }, { company: { contains: q } }] },
        select: { id: true, name: true, email: true, phone: true, company: true },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ number: { contains: q } }, { customer: { name: { contains: q } } }] },
        select: { id: true, number: true, total: true, status: true, customer: { select: { name: true } } },
        take: 5,
      }),
      prisma.order.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ number: { contains: q } }, { customer: { name: { contains: q } } }] },
        select: { id: true, number: true, total: true, status: true, customer: { select: { name: true } } },
        take: 5,
      }),
      prisma.supplier.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }, { contactPerson: { contains: q } }] },
        select: { id: true, name: true, email: true, phone: true },
        take: 5,
      }),
      prisma.category.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ name: { contains: q } }, { description: { contains: q } }] },
        select: { id: true, name: true, description: true },
        take: 5,
      }),
      prisma.quotation.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ number: { contains: q } }, { customer: { name: { contains: q } } }] },
        select: { id: true, number: true, total: true, status: true, customer: { select: { name: true } } },
        take: 5,
      }),
      prisma.payment.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ reference: { contains: q } }, { notes: { contains: q } }] },
        select: { id: true, reference: true, amount: true, method: true, date: true },
        take: 5,
      }),
      prisma.warehouse.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ name: { contains: q } }, { location: { contains: q } }] },
        select: { id: true, name: true, location: true },
        take: 5,
      }),
      prisma.distributor.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ name: { contains: q } }, { email: { contains: q } }, { phone: { contains: q } }, { territory: { contains: q } }, { contactPerson: { contains: q } }] },
        select: { id: true, name: true, email: true, phone: true, territory: true },
        take: 5,
      }),
      prisma.delivery.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ number: { contains: q } }, { trackingNumber: { contains: q } }, { carrier: { contains: q } }] },
        select: { id: true, number: true, trackingNumber: true, carrier: true, status: true, distributor: { select: { name: true } } },
        take: 5,
      }),
      prisma.stockCount.findMany({
        where: { organizationId: org.id, deletedAt: null, OR: [{ number: { contains: q } }] },
        select: { id: true, number: true, status: true, warehouse: { select: { name: true } } },
        take: 5,
      }),
    ])

    const [matchedDocs, matchedPrograms, matchedArticles] = await Promise.all([
      prisma.knowledgeDocument.findMany({ where: { organizationId: org.id, OR: [{ name: { contains: q } }, { type: { contains: q } }, { relatedTo: { contains: q } }] }, take: 5, select: { id: true, name: true, type: true } }),
      prisma.trainingProgram.findMany({ where: { organizationId: org.id, OR: [{ title: { contains: q } }, { description: { contains: q } }] }, take: 5, select: { id: true, title: true, type: true } }),
      prisma.wikiArticle.findMany({ where: { organizationId: org.id, OR: [{ title: { contains: q } }, { excerpt: { contains: q } }, { category: { contains: q } }] }, take: 5, select: { id: true, title: true, category: true } }),
    ])
    return NextResponse.json({
      products: products.map((p) => ({ id: p.id, name: p.name, sku: p.sku, type: p.type, image: p.image })),
      customers: customers.map((c) => ({ id: c.id, name: c.name, email: c.email, phone: c.phone, company: c.company })),
      invoices: invoices.map((inv) => ({ id: inv.id, number: inv.number, total: inv.total, status: inv.status, customerName: inv.customer?.name || null })),
      orders: orders.map((o) => ({ id: o.id, number: o.number, total: o.total, status: o.status, customerName: o.customer?.name || null })),
      suppliers: suppliers.map((s) => ({ id: s.id, name: s.name, email: s.email, phone: s.phone })),
      categories: categories.map((c) => ({ id: c.id, name: c.name, description: c.description })),
      quotations: quotations.map((q) => ({ id: q.id, number: q.number, total: q.total, status: q.status, customerName: q.customer?.name || null })),
      payments: payments.map((p) => ({ id: p.id, reference: p.reference, amount: p.amount, method: p.method, date: p.date })),
      warehouses: warehouses.map((w) => ({ id: w.id, name: w.name, location: w.location })),
      documents: matchedDocs.map((d) => ({ id: d.id, name: d.name, type: d.type })),
      training: matchedPrograms.map((p) => ({ id: p.id, title: p.title, type: p.type })),
      wiki: matchedArticles.map((a) => ({ id: a.id, title: a.title, category: a.category })),
      distributors: distributors.map((d) => ({ id: d.id, name: d.name, email: d.email, phone: d.phone, territory: d.territory })),
      deliveries: deliveries.map((d) => ({ id: d.id, number: d.number, trackingNumber: d.trackingNumber, carrier: d.carrier, status: d.status, distributorName: d.distributor?.name || null })),
      stockCounts: stockCounts.map((s) => ({ id: s.id, number: s.number, status: s.status, warehouseName: s.warehouse?.name || null })),
    })
  } catch {
    return NextResponse.json({ products: [], customers: [], invoices: [], orders: [], suppliers: [], categories: [], quotations: [], payments: [], warehouses: [], documents: [], training: [], wiki: [], distributors: [], deliveries: [], stockCounts: [] })
  }
}
