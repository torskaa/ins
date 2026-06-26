import { PrismaClient } from "@/generated/prisma/client"
import { PrismaSqlite } from "prisma-adapter-sqlite"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient({
  adapter: new PrismaSqlite({ url: process.env["DATABASE_URL"] || "file:./dev.db" }),
} as any)

async function main() {
  console.log("Seeding database...")

  const passwordHash = await bcrypt.hash("password123", 12)

  // ── ORGANIZATION ──
  const org = await prisma.organization.upsert({
    where: { slug: "ins-demo" },
    update: {},
    create: {
      name: "Ins Demo",
      slug: "ins-demo",
      settings: {
        create: { currency: "THB", taxRate: 7, dateFormat: "DD/MM/YYYY", timezone: "Asia/Bangkok", lowStockThreshold: 10 },
      },
    },
  })
  console.log("  Organization: Ins Demo")

  const user = await prisma.user.upsert({
    where: { email: "admin@ins.com" },
    update: {},
    create: {
      name: "Admin User", email: "admin@ins.com", passwordHash,
      image: "https://api.dicebear.com/7.x/notionists/svg?seed=Admin",
    },
  })
  console.log("  User: admin@ins.com")

  await prisma.organizationMember.upsert({
    where: { userId_organizationId: { userId: user.id, organizationId: org.id } },
    update: {},
    create: { userId: user.id, organizationId: org.id, role: "owner" },
  })

  // ── CATEGORIES (5) ──
  const catData = [
    { id: "cat-el", name: "Electronics", slug: "electronics", desc: "Electronic devices and accessories" },
    { id: "cat-fn", name: "Furniture", slug: "furniture", desc: "Office and home furniture" },
    { id: "cat-st", name: "Stationery", slug: "stationery", desc: "Office supplies and stationery" },
    { id: "cat-nt", name: "Networking", slug: "networking", desc: "Network equipment and cabling" },
    { id: "cat-of", name: "Office Equipment", slug: "office-equipment", desc: "General office machinery" },
  ]
  const categories = await Promise.all(catData.map((c) =>
    prisma.category.upsert({
      where: { slug_organizationId: { slug: c.slug, organizationId: org.id } },
      update: {},
      create: { name: c.name, slug: c.slug, description: c.desc, organizationId: org.id },
    })
  ))
  console.log(`  Categories: ${categories.length}`)

  // ── WAREHOUSES (5) ──
  const whData = [
    { id: "wh-main", name: "Main Warehouse", location: "Bangkok, Thailand", capacity: 10000 },
    { id: "wh-north", name: "Northern Branch", location: "Chiang Mai, Thailand", capacity: 5000 },
    { id: "wh-east", name: "Eastern Distribution", location: "Chonburi, Thailand", capacity: 8000 },
    { id: "wh-south", name: "Southern Depot", location: "Surat Thani, Thailand", capacity: 3000 },
    { id: "wh-pick", name: "Picking Area", location: "Bangkok (onsite)", capacity: 500 },
  ]
  const warehouses = await Promise.all(whData.map((w) =>
    prisma.warehouse.upsert({
      where: { id: w.id },
      update: {},
      create: { ...w, organizationId: org.id },
    })
  ))
  console.log(`  Warehouses: ${warehouses.length}`)

  // ── SUPPLIERS (5) ──
  const supData = [
    { id: "sup-1", name: "TechSupply Co.", email: "contact@techsupply.com", phone: "+66 2-123-4567", taxId: "0105555123456", paymentTerms: "Net 30", currency: "THB", rating: "preferred" as const, defaultLeadTime: 7 },
    { id: "sup-2", name: "FurniWorld Ltd.", email: "sales@furniworld.com", phone: "+66 2-234-5678", taxId: "0105555234567", paymentTerms: "Net 45", currency: "THB", rating: "preferred" as const, defaultLeadTime: 14 },
    { id: "sup-3", name: "OfficeMate Supply", email: "orders@officemate.com", phone: "+66 2-345-6789", taxId: "0105555345678", paymentTerms: "Net 15", currency: "THB", rating: "active" as const, defaultLeadTime: 3 },
    { id: "sup-4", name: "NetConnect Solutions", email: "info@netconnect.com", phone: "+66 2-456-7890", taxId: "0105555456789", paymentTerms: "Net 30", currency: "THB", rating: "active" as const, defaultLeadTime: 10 },
    { id: "sup-5", name: "GlobalParts Inc.", email: "parts@globalparts.com", phone: "+66 2-567-8901", taxId: "0105555567890", paymentTerms: "Net 60", currency: "USD", rating: "active" as const, defaultLeadTime: 21 },
  ]
  const suppliers = await Promise.all(supData.map((s) =>
    prisma.supplier.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, organizationId: org.id },
    })
  ))
  console.log(`  Suppliers: ${suppliers.length}`)

  // ── CUSTOMERS (5) ──
  const custData = [
    { id: "cust-1", name: "Somchai Electronics", email: "somchai@example.com", phone: "+66 81-123-4567", company: "Somchai Electronics Co.", creditLimit: 500000 },
    { id: "cust-2", name: "Pranee Office Supply", email: "pranee@example.com", phone: "+66 82-234-5678", company: "Pranee Office Supply Ltd.", creditLimit: 300000 },
    { id: "cust-3", name: "Ananda Tech", email: "ananda@example.com", phone: "+66 83-345-6789", company: null, creditLimit: 200000 },
    { id: "cust-4", name: "Bunsom Trading", email: "bunsom@example.com", phone: "+66 84-456-7890", company: "Bunsom Trading Co.", creditLimit: 1000000 },
    { id: "cust-5", name: "Sirikit Foundation", email: "sirikit@example.com", phone: "+66 85-567-8901", company: "Sirikit Foundation", creditLimit: null },
  ]
  const customers = await Promise.all(custData.map((c) =>
    prisma.customer.upsert({
      where: { id: c.id },
      update: {},
      create: { ...c, organizationId: org.id },
    })
  ))
  console.log(`  Customers: ${customers.length}`)

  // ── PRODUCTS (10: 7 FG + 3 RM) ──
  type ProductDef = { id: string; sku: string; name: string; type: "finished_good" | "raw_material"; catIdx: number; supIdx: number | null; whIdx: number; price: number; cost: number; stock: number; min: number; max: number; desc: string; loc: string; barcode: string; image?: string }
  const prodData: ProductDef[] = [
    { id: "prod-1", sku: "LAP-001", name: "Laptop Pro 15\"", type: "finished_good", catIdx: 0, supIdx: 0, whIdx: 0, price: 45900, cost: 38000, stock: 25, min: 5, max: 100, desc: "High-performance laptop for professionals", loc: "A-01-01", barcode: "8850001234567", image: "https://picsum.photos/seed/laptop/400/400" },
    { id: "prod-2", sku: "MON-002", name: "Monitor 27\" 4K", type: "finished_good", catIdx: 0, supIdx: 0, whIdx: 0, price: 15900, cost: 12000, stock: 50, min: 10, max: 200, desc: "27-inch 4K UHD monitor", loc: "A-02-01", barcode: "8850001234574", image: "https://picsum.photos/seed/monitor/400/400" },
    { id: "prod-3", sku: "KB-003", name: "Mechanical Keyboard", type: "finished_good", catIdx: 0, supIdx: 0, whIdx: 0, price: 3900, cost: 2500, stock: 100, min: 20, max: 500, desc: "RGB mechanical keyboard with blue switches", loc: "A-03-01", barcode: "8850001234581", image: "https://picsum.photos/seed/keyboard/400/400" },
    { id: "prod-4", sku: "DESK-001", name: "Standing Desk", type: "finished_good", catIdx: 1, supIdx: 1, whIdx: 0, price: 12900, cost: 8500, stock: 15, min: 5, max: 50, desc: "Electric height-adjustable standing desk", loc: "B-01-01", barcode: "8850001234598", image: "https://picsum.photos/seed/desk/400/400" },
    { id: "prod-5", sku: "CHAIR-001", name: "Ergonomic Office Chair", type: "finished_good", catIdx: 1, supIdx: 1, whIdx: 0, price: 8900, cost: 5500, stock: 30, min: 10, max: 100, desc: "Adjustable lumbar support office chair", loc: "B-02-01", barcode: "8850001234604", image: "https://picsum.photos/seed/chair/400/400" },
    { id: "prod-6", sku: "SW-001", name: "Network Switch 24-Port", type: "finished_good", catIdx: 3, supIdx: 3, whIdx: 1, price: 8500, cost: 6200, stock: 12, min: 5, max: 50, desc: "Gigabit managed network switch", loc: "D-01-01", barcode: "8850001234611", image: "https://picsum.photos/seed/network-switch/400/400" },
    { id: "prod-7", sku: "PRT-001", name: "Laser Printer A4", type: "finished_good", catIdx: 4, supIdx: 4, whIdx: 2, price: 12500, cost: 9000, stock: 8, min: 3, max: 30, desc: "High-speed monochrome laser printer", loc: "E-01-01", barcode: "8850001234628", image: "https://picsum.photos/seed/printer/400/400" },
    { id: "prod-8", sku: "PCB-001", name: "Mainboard PCB Assembly", type: "raw_material", catIdx: 0, supIdx: 4, whIdx: 3, price: 4500, cost: 3200, stock: 200, min: 50, max: 1000, desc: "Custom PCB for laptop assembly", loc: "F-01-01", barcode: "8850001234635", image: "https://picsum.photos/seed/pcb/400/400" },
    { id: "prod-9", sku: "BATT-001", name: "Lithium Battery 5000mAh", type: "raw_material", catIdx: 0, supIdx: 4, whIdx: 3, price: 1200, cost: 800, stock: 300, min: 100, max: 2000, desc: "Rechargeable lithium-ion battery pack", loc: "F-02-01", barcode: "8850001234642", image: "https://picsum.photos/seed/battery/400/400" },
    { id: "prod-10", sku: "ALU-001", name: "Aluminum Frame Kit", type: "raw_material", catIdx: 1, supIdx: 2, whIdx: 4, price: 2800, cost: 1900, stock: 80, min: 20, max: 400, desc: "Extruded aluminum frame for desk assembly", loc: "G-01-01", barcode: "8850001234659", image: "https://picsum.photos/seed/aluminum/400/400" },
  ]
  const products = await Promise.all(prodData.map((p) =>
    prisma.product.upsert({
      where: { sku_organizationId: { sku: p.sku, organizationId: org.id } },
      update: { barcode: p.barcode },
      create: {
        name: p.name, sku: p.sku, barcode: p.barcode, type: p.type, unitPrice: p.price, costPrice: p.cost,
        stock: p.stock, minStock: p.min, maxStock: p.max, safetyStock: Math.floor(p.min / 2),
        uom: "pcs", leadTime: 7, description: p.desc, location: p.loc, image: p.image,
        categoryId: categories[p.catIdx].id, supplierId: p.supIdx !== null ? suppliers[p.supIdx].id : undefined,
        warehouseId: warehouses[p.whIdx].id, organizationId: org.id,
      },
    })
  ))
  console.log(`  Products: ${products.length}`)

  // ── SUPPLIER PRICES ──
  const spData = [
    { prodIdx: 0, supIdx: 0, price: 38000, curr: "THB", lead: 7, def: true },
    { prodIdx: 1, supIdx: 0, price: 12000, curr: "THB", lead: 7, def: true },
    { prodIdx: 2, supIdx: 0, price: 2500, curr: "THB", lead: 5, def: true },
    { prodIdx: 7, supIdx: 4, price: 3200, curr: "USD", lead: 21, def: true },
    { prodIdx: 8, supIdx: 4, price: 800, curr: "USD", lead: 21, def: true },
    { prodIdx: 9, supIdx: 2, price: 1900, curr: "THB", lead: 7, def: true },
  ]
  await Promise.all(spData.map((sp) =>
    prisma.supplierPrice.upsert({
      where: { productId_supplierId: { productId: products[sp.prodIdx].id, supplierId: suppliers[sp.supIdx].id } },
      update: { price: sp.price, currency: sp.curr, leadTime: sp.lead, isDefault: sp.def },
      create: { productId: products[sp.prodIdx].id, supplierId: suppliers[sp.supIdx].id, price: sp.price, currency: sp.curr, leadTime: sp.lead, isDefault: sp.def },
    })
  ))
  console.log("  Supplier Prices: 6")

  // ── LOTS (5) ──
  const now = new Date()
  const lotData = [
    { number: "LOT-2024-001", productId: products[0].id, supplierId: suppliers[0].id, qty: 50, cost: 37800, date: new Date("2024-11-01"), expiry: new Date("2027-11-01") },
    { number: "LOT-2024-002", productId: products[4].id, supplierId: suppliers[1].id, qty: 30, cost: 5400, date: new Date("2024-11-15"), expiry: null },
    { number: "LOT-2024-003", productId: products[7].id, supplierId: suppliers[4].id, qty: 500, cost: 3100, date: new Date("2024-10-01"), expiry: new Date("2028-10-01") },
    { number: "LOT-2024-004", productId: products[8].id, supplierId: suppliers[4].id, qty: 1000, cost: 790, date: new Date("2024-12-01"), expiry: new Date("2026-12-01") },
    { number: "LOT-2025-001", productId: products[9].id, supplierId: suppliers[2].id, qty: 200, cost: 1850, date: new Date("2025-01-10"), expiry: null },
  ]
  await Promise.all(lotData.map((l) =>
    prisma.lot.upsert({
      where: { id: `lot-${l.number}` },
      update: {},
      create: {
        id: `lot-${l.number}`, number: l.number, productId: l.productId, supplierId: l.supplierId,
        quantity: l.qty, costPrice: l.cost, receivedDate: l.date, expiryDate: l.expiry, organizationId: org.id,
      },
    })
  ))
  console.log(`  Lots: ${lotData.length}`)

  // ── BOMS (5) ──
  const bomSpecs = [
    { fg: products[0], version: 1, items: [{ mat: products[7], qty: 1, scrap: 2 }, { mat: products[8], qty: 1, scrap: 1 }], status: "approved" as const },
    { fg: products[4], version: 1, items: [{ mat: products[9], qty: 2, scrap: 5 }, { mat: products[7], qty: 0.5, scrap: 0 }], status: "approved" as const },
    { fg: products[5], version: 1, items: [{ mat: products[7], qty: 0.25, scrap: 0 }], status: "draft" as const },
    { fg: products[0], version: 2, items: [{ mat: products[7], qty: 1, scrap: 1 }, { mat: products[8], qty: 1, scrap: 1 }], status: "draft" as const },
    { fg: products[6], version: 1, items: [{ mat: products[7], qty: 0.5, scrap: 0 }, { mat: products[8], qty: 0.3, scrap: 0 }], status: "submitted" as const },
  ]
  for (const bom of bomSpecs) {
    const existing = await prisma.billOfMaterial.findFirst({
      where: { finishedGoodId: bom.fg.id, version: bom.version, organizationId: org.id },
    })
    if (!existing) {
      await prisma.billOfMaterial.create({
        data: {
          finishedGoodId: bom.fg.id, materialId: bom.items[0].mat.id, quantity: bom.items[0].qty,
          scrapAllowance: bom.items[0].scrap, unit: "pcs", version: bom.version, status: bom.status,
          organizationId: org.id,
        },
      })
      if (bom.items[1]) {
        await prisma.billOfMaterial.create({
          data: {
            finishedGoodId: bom.fg.id, materialId: bom.items[1].mat.id, quantity: bom.items[1].qty,
            scrapAllowance: bom.items[1].scrap, unit: "pcs", version: bom.version, status: bom.status,
            organizationId: org.id,
          },
        })
      }
    }
  }
  console.log("  BOMs: 5")

  // ── ORDERS (5) ──
  const orderDefs = [
    { id: "ord-1", number: "SO-2024-001", type: "sales" as const, status: "delivered" as const, custIdx: 0, date: new Date("2024-12-01"), delivered: new Date("2024-12-05"), items: [{ prodIdx: 0, qty: 1, price: 45900 }, { prodIdx: 1, qty: 1, price: 15900 }] },
    { id: "ord-2", number: "SO-2025-001", type: "sales" as const, status: "confirmed" as const, custIdx: 1, date: new Date("2025-01-10"), delivered: null, items: [{ prodIdx: 2, qty: 10, price: 3900 }, { prodIdx: 4, qty: 5, price: 8900 }] },
    { id: "ord-3", number: "SO-2025-002", type: "sales" as const, status: "processing" as const, custIdx: 2, date: new Date("2025-01-15"), delivered: null, items: [{ prodIdx: 5, qty: 3, price: 8500 }] },
    { id: "ord-4", number: "PO-2025-001", type: "purchase" as const, status: "delivered" as const, supIdx: 0, date: new Date("2025-01-05"), delivered: new Date("2025-01-12"), items: [{ prodIdx: 0, qty: 10, price: 38000 }] },
    { id: "ord-5", number: "PO-2025-002", type: "purchase" as const, status: "confirmed" as const, supIdx: 4, date: new Date("2025-01-20"), delivered: null, items: [{ prodIdx: 7, qty: 100, price: 3200 }, { prodIdx: 8, qty: 200, price: 800 }] },
  ]
  for (const o of orderDefs) {
    const items = o.items.map((i) => ({ productId: products[i.prodIdx].id, quantity: i.qty, unitPrice: i.price, total: i.qty * i.price }))
    const sub = items.reduce((s, i) => s + i.total, 0)
    await prisma.order.upsert({
      where: { id: o.id },
      update: {},
      create: {
        id: o.id, number: o.number, type: o.type, status: o.status, subtotal: sub, tax: Math.round(sub * 0.07), total: Math.round(sub * 1.07),
        orderDate: o.date, deliveredAt: o.delivered, customerId: o.custIdx !== undefined ? customers[o.custIdx].id : undefined,
        supplierId: (o as any).supIdx !== undefined ? suppliers[(o as any).supIdx].id : undefined,
        organizationId: org.id,
      },
    })
    await prisma.orderItem.createMany({ data: items.map((it) => ({ ...it, orderId: o.id })) })
  }
  console.log("  Orders: 5")

  // ── QUOTATIONS (5) ──
  const qDefs = [
    { id: "q-1", number: "QT-2024-001", status: "confirmed" as const, custIdx: 1, valid: new Date("2025-01-15"), items: [{ prodIdx: 2, qty: 5, price: 3900 }, { prodIdx: 3, qty: 2, price: 12900 }] },
    { id: "q-2", number: "QT-2025-001", status: "sent" as const, custIdx: 3, valid: new Date("2025-03-01"), items: [{ prodIdx: 5, qty: 10, price: 8500 }] },
    { id: "q-3", number: "QT-2025-002", status: "draft" as const, custIdx: 0, valid: new Date("2025-02-28"), items: [{ prodIdx: 6, qty: 2, price: 12500 }] },
    { id: "q-4", number: "QT-2025-003", status: "expired" as const, custIdx: 4, valid: new Date("2024-12-31"), items: [{ prodIdx: 0, qty: 3, price: 45900 }, { prodIdx: 1, qty: 5, price: 15900 }] },
    { id: "q-5", number: "QT-2025-004", status: "sent" as const, custIdx: 2, valid: new Date("2025-02-15"), items: [{ prodIdx: 3, qty: 1, price: 12900 }, { prodIdx: 4, qty: 4, price: 8900 }] },
  ]
  for (const q of qDefs) {
    const items = q.items.map((i) => ({ productId: products[i.prodIdx].id, quantity: i.qty, unitPrice: i.price, total: i.qty * i.price }))
    const sub = items.reduce((s, i) => s + i.total, 0)
    const orderId = q.status === "confirmed" ? "ord-2" : undefined
    await prisma.quotation.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id, number: q.number, status: q.status, customerId: customers[q.custIdx].id, orderId,
        validUntil: q.valid, subtotal: sub, tax: Math.round(sub * 0.07), total: Math.round(sub * 1.07),
        organizationId: org.id,
      },
    })
    await prisma.quotationItem.createMany({ data: items.map((it) => ({ ...it, quotationId: q.id })) })
  }
  console.log("  Quotations: 5")

  // ── INVOICES (5) ──
  const invDefs = [
    { id: "inv-1", number: "INV-2024-001", status: "paid" as const, custIdx: 0, issue: new Date("2024-12-01"), due: new Date("2024-12-30"), paid: 66126, orderId: "ord-1", items: [{ prodIdx: 0, qty: 1, price: 45900 }, { prodIdx: 1, qty: 1, price: 15900 }] },
    { id: "inv-2", number: "INV-2025-001", status: "sent" as const, custIdx: 1, issue: new Date("2025-01-10"), due: new Date("2025-02-09"), paid: 0, orderId: "ord-2", items: [{ prodIdx: 2, qty: 10, price: 3900 }, { prodIdx: 4, qty: 5, price: 8900 }] },
    { id: "inv-3", number: "INV-2025-002", status: "overdue" as const, custIdx: 3, issue: new Date("2025-01-01"), due: new Date("2025-01-15"), paid: 10000, orderId: null, items: [{ prodIdx: 5, qty: 3, price: 8500 }] },
    { id: "inv-4", number: "INV-2025-003", status: "draft" as const, custIdx: 2, issue: new Date("2025-01-20"), due: new Date("2025-02-19"), paid: 0, orderId: null, items: [{ prodIdx: 6, qty: 1, price: 12500 }] },
    { id: "inv-5", number: "INV-2025-004", status: "cancelled" as const, custIdx: 4, issue: new Date("2025-01-05"), due: new Date("2025-02-04"), paid: 0, orderId: null, items: [{ prodIdx: 3, qty: 2, price: 12900 }] },
  ]
  for (const inv of invDefs) {
    const items = inv.items.map((i) => ({ description: products[i.prodIdx].name, productId: products[i.prodIdx].id, quantity: i.qty, unitPrice: i.price, total: i.qty * i.price }))
    const sub = items.reduce((s, i) => s + i.total, 0)
    await prisma.invoice.upsert({
      where: { id: inv.id },
      update: {},
      create: {
        id: inv.id, number: inv.number, status: inv.status, issueDate: inv.issue, dueDate: inv.due,
        subtotal: sub, tax: Math.round(sub * 0.07), total: Math.round(sub * 1.07), paidAmount: inv.paid,
        customerId: customers[inv.custIdx].id, orderId: inv.orderId, organizationId: org.id,
      },
    })
    await prisma.invoiceItem.createMany({ data: items.map((it) => ({ ...it, invoiceId: inv.id })) })
  }
  console.log("  Invoices: 5")

  // ── PAYMENTS (5) ──
  const payData = [
    { amount: 66126, date: new Date("2024-12-03"), method: "bank_transfer" as const, ref: "TRF-2024-001", invIdx: 0, ordIdx: 0 },
    { amount: 50000, date: new Date("2025-01-20"), method: "credit_card" as const, ref: "CC-2025-001", invIdx: 2, ordIdx: null },
    { amount: 10000, date: new Date("2025-01-22"), method: "bank_transfer" as const, ref: "TRF-2025-001", invIdx: 2, ordIdx: null },
    { amount: 83500, date: new Date("2025-01-12"), method: "bank_transfer" as const, ref: "TRF-2025-002", invIdx: null, ordIdx: 4 },
    { amount: 15000, date: new Date("2025-01-25"), method: "cash" as const, ref: "CSH-2025-001", invIdx: null, ordIdx: null },
  ]
  await Promise.all(payData.map((p, i) =>
    prisma.payment.create({
      data: {
        amount: p.amount, date: p.date, method: p.method, reference: p.ref,
        invoiceId: p.invIdx !== null ? invDefs[p.invIdx].id : undefined,
        orderId: p.ordIdx !== null ? orderDefs[p.ordIdx].id : undefined,
        organizationId: org.id,
      },
    })
  ))
  console.log(`  Payments: ${payData.length}`)

  // ── STOCK MOVEMENTS ──
  const smData = [
    { type: "received" as const, qty: 50, prodIdx: 0, whIdx: 0, ref: "LOT-2024-001" },
    { type: "sold" as const, qty: -1, prodIdx: 0, whIdx: 0, ref: "SO-2024-001" },
    { type: "sold" as const, qty: -1, prodIdx: 1, whIdx: 0, ref: "SO-2024-001" },
    { type: "received" as const, qty: 30, prodIdx: 4, whIdx: 0, ref: "LOT-2024-002" },
    { type: "received" as const, qty: 200, prodIdx: 9, whIdx: 4, ref: "LOT-2025-001" },
  ]
  await prisma.stockMovement.createMany({
    data: smData.map((m) => ({
      type: m.type, quantity: Math.abs(m.qty), description: `Stock ${m.type}: ${m.ref}`,
      reference: m.ref, productId: products[m.prodIdx].id, warehouseId: warehouses[m.whIdx].id,
      organizationId: org.id,
    })),
  })
  console.log(`  Stock Movements: ${smData.length}`)

  // ── DISCOUNT RULES (3) ──
  await Promise.all([
    prisma.discountRule.upsert({
      where: { id: "dr-1" }, update: {},
      create: { id: "dr-1", name: "New Customer 10%", description: "10% discount for first-time customers", type: "percentage" as const, value: 10, minPurchase: 1000, active: true, organizationId: org.id },
    }),
    prisma.discountRule.upsert({
      where: { id: "dr-2" }, update: {},
      create: { id: "dr-2", name: "Bulk Order 15%", description: "15% off orders over 50,000 THB", type: "percentage" as const, value: 15, minPurchase: 50000, active: true, organizationId: org.id },
    }),
    prisma.discountRule.upsert({
      where: { id: "dr-3" }, update: {},
      create: { id: "dr-3", name: "Free Shipping", description: "Free shipping for orders over 20,000 THB", type: "fixed_amount" as const, value: 1000, minPurchase: 20000, active: true, organizationId: org.id },
    }),
  ])
  console.log("  Discount Rules: 3")

  // ── ACTIVITY LOGS ──
  await prisma.activityLog.createMany({ data: [
    { action: "created" as any, entity: "Organization", entityId: org.id, message: "Organization initialized with demo data", userId: user.id, organizationId: org.id },
    { action: "created" as any, entity: "Product", entityId: products[0].id, message: "Product Laptop Pro 15\" created", userId: user.id, organizationId: org.id },
    { action: "created" as any, entity: "Order", entityId: orderDefs[0].id, message: "Order SO-2024-001 created", userId: user.id, organizationId: org.id },
    { action: "created" as any, entity: "Invoice", entityId: invDefs[0].id, message: "Invoice INV-2024-001 created & paid", userId: user.id, organizationId: org.id },
    { action: "created" as any, entity: "Supplier", entityId: suppliers[0].id, message: "Supplier TechSupply Co. created", userId: user.id, organizationId: org.id },
  ]})
  console.log("  Activity Logs: 5")

  // ── NOTIFICATIONS (5) ──
  const existingNotif = await prisma.notification.findFirst({ where: { id: "notif-1" } })
  if (!existingNotif) {
    await prisma.notification.createMany({ data: [
      { id: "notif-1", type: "info", title: "Welcome to Ins!", message: "Your inventory management system is ready with demo data. Explore all modules!", userId: user.id, organizationId: org.id },
      { id: "notif-2", type: "low_stock", title: "Low Stock Alert", message: `Laptop Pro 15" is running low (${products[0].stock} left)`, userId: user.id, organizationId: org.id },
      { id: "notif-3", type: "success", title: "Order Delivered", message: "Order SO-2024-001 has been delivered successfully", userId: user.id, organizationId: org.id },
      { id: "notif-4", type: "warning", title: "Pending Approval", message: "BOM v2 for Laptop Pro 15 is pending approval", userId: user.id, organizationId: org.id },
      { id: "notif-5", type: "order", title: "New Sales Order", message: "Order SO-2025-001 has been created for 15 items", userId: user.id, organizationId: org.id, read: true },
    ]})
  }
  console.log("  Notifications: 5")

  // ── FORECAST ENTRIES (5) ──
  await prisma.forecastEntry.createMany({ data: [
    { productId: products[0].id, date: new Date("2025-02-01"), forecastQuantity: 30, actualQuantity: 25, confidence: 0.85, organizationId: org.id },
    { productId: products[0].id, date: new Date("2025-03-01"), forecastQuantity: 35, actualQuantity: 0, confidence: 0.8, organizationId: org.id },
    { productId: products[1].id, date: new Date("2025-02-01"), forecastQuantity: 60, actualQuantity: 55, confidence: 0.9, organizationId: org.id },
    { productId: products[4].id, date: new Date("2025-02-01"), forecastQuantity: 20, actualQuantity: 15, confidence: 0.75, organizationId: org.id },
    { productId: products[5].id, date: new Date("2025-03-01"), forecastQuantity: 10, actualQuantity: 0, confidence: 0.7, organizationId: org.id },
  ]})
  console.log("  Forecast Entries: 5")

  // ── DISTRIBUTORS (8) ──
  const distData = [
    { id: "dist-1", name: "บางกอก ดีสทริบิวชั่น", email: "info@bangkokdist.com", phone: "+66 2-111-2233", address: "123 ถ.สุขุมวิท กรุงเทพฯ", taxId: "0105555123401", contactPerson: "สมชาย ใจดี", territory: "กรุงเทพมหานคร", route: "BKK-01", contractStart: new Date("2024-01-01"), contractEnd: new Date("2025-12-31"), status: "active" as const },
    { id: "dist-2", name: "เชียงใหม่ ดิสทริบิวเตอร์", email: "sales@cmdist.com", phone: "+66 53-234-567", address: "456 ถ.ห้วยแก้ว เชียงใหม่", taxId: "0105555123402", contactPerson: "นางสาวสมศรี รักดี", territory: "เชียงใหม่", route: "CM-01", contractStart: new Date("2024-03-01"), contractEnd: new Date("2025-12-31"), status: "active" as const },
    { id: "dist-3", name: "ภูเก็ต โลจิสติกส์", email: "info@phuketlog.com", phone: "+66 76-345-678", address: "789 ถ.ภูเก็ต ภูเก็ต", taxId: "0105555123403", contactPerson: "วิชัย ทรัพย์มงคล", territory: "ภูเก็ต", route: "PK-01", contractStart: new Date("2024-06-01"), contractEnd: new Date("2025-06-01"), status: "active" as const },
    { id: "dist-4", name: "ขอนแก่น ดิสทริบิวชั่น", email: "info@kkdist.com", phone: "+66 43-456-789", address: "321 ถ.มิตรภาพ ขอนแก่น", taxId: "0105555123404", contactPerson: "ประเสริฐ ศรีสุวรรณ", territory: "ขอนแก่น", route: "KK-01", contractStart: new Date("2024-02-01"), contractEnd: new Date("2025-08-31"), status: "active" as const },
    { id: "dist-5", name: "ชลบุรี ทรานสปอร์ต", email: "contact@chonburitrans.com", phone: "+66 38-567-890", address: "654 ถ.บางแสน ชลบุรี", taxId: "0105555123405", contactPerson: "สมหมาย เร็วไว", territory: "ชลบุรี", route: "CB-01", contractStart: new Date("2024-04-01"), contractEnd: new Date("2026-03-31"), status: "active" as const },
    { id: "dist-6", name: "สุราษฎร์ธานี ดีสทริบิวเตอร์", email: "info@suratdist.com", phone: "+66 77-678-901", address: "987 ถ.ตลาดใหม่ สุราษฎร์ธานี", taxId: "0105555123406", contactPerson: "กฤษณะ พันธ์ดี", territory: "สุราษฎร์ธานี", route: "SR-01", contractStart: new Date("2024-05-01"), contractEnd: new Date("2025-11-30"), status: "inactive" as const },
    { id: "dist-7", name: "นครราชสีมา ซัพพลาย", email: "info@koratsupply.com", phone: "+66 44-789-012", address: "159 ถ.มิตรภาพ โคราช", taxId: "0105555123407", contactPerson: "อดิศร กล้าหาญ", territory: "นครราชสีมา", route: "NR-01", contractStart: new Date("2024-07-01"), contractEnd: new Date("2025-07-01"), status: "active" as const },
    { id: "dist-8", name: "สมุทรปราการ โลจิสติกส์", email: "info@spklog.com", phone: "+66 2-890-1234", address: "753 ถ.สุขสวัสดิ์ สมุทรปราการ", taxId: "0105555123408", contactPerson: "มานะ ขยันงาน", territory: "สมุทรปราการ", route: "SP-01", contractStart: new Date("2024-01-15"), contractEnd: new Date("2025-10-31"), status: "suspended" as const },
  ]
  const distributors = await Promise.all(distData.map((d) =>
    prisma.distributor.upsert({
      where: { id: d.id },
      update: {},
      create: { ...d, organizationId: org.id },
    })
  ))
  console.log(`  Distributors: ${distributors.length}`)

  // ── DELIVERIES (15) ──
  const delStatuses = ["packing", "shipped", "in_transit", "delivered", "failed", "cancelled", "draft"] as const
  const delData = Array.from({ length: 15 }, (_, i) => {
    const status = delStatuses[i % delStatuses.length]
    const distIdx = i % 8
    const whIdx = i % 5
    const items = [
      { productId: products[i % 10].id, quantity: (i + 1) * 2, unitPrice: products[i % 10].unitPrice },
      { productId: products[(i + 3) % 10].id, quantity: (i + 1), unitPrice: products[(i + 3) % 10].unitPrice },
    ]
    const totalItems = items.reduce((s, it) => s + it.quantity, 0)
    const totalValue = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
    const estDate = new Date(2025, 0, 15 + i * 2)
    const actualDate = status === "delivered" ? new Date(estDate.getTime() + 86400000 * 2) : null
    return {
      id: `del-${i + 1}`,
      number: `DEL-2025-${String(i + 1).padStart(3, "0")}`,
      status,
      trackingNumber: status !== "draft" && status !== "cancelled" ? `TRK${String(1000 + i)}` : null,
      carrier: status !== "draft" ? ["DHL", "FedEx", "Kerry", "Flash", "J&T"][i % 5] : null,
      estimatedDate: estDate,
      actualDate,
      notes: status === "failed" ? "Package damaged in transit" : status === "cancelled" ? "Cancelled by customer" : null,
      origin: "Main Warehouse, Bangkok",
      destination: [distData[distIdx].address, distData[distIdx].territory].filter(Boolean).join(", "),
      totalItems,
      totalValue,
      distributorId: distributors[distIdx].id,
      warehouseId: warehouses[whIdx].id,
      items,
    }
  })

  for (const d of delData) {
    const existing = await prisma.delivery.findFirst({ where: { id: d.id } })
    if (existing) continue
    await prisma.delivery.create({
      data: {
        id: d.id,
        number: d.number,
        status: d.status,
        trackingNumber: d.trackingNumber,
        carrier: d.carrier,
        estimatedDate: d.estimatedDate,
        actualDate: d.actualDate,
        notes: d.notes,
        origin: d.origin,
        destination: d.destination,
        totalItems: d.totalItems,
        totalValue: d.totalValue,
        distributorId: d.distributorId,
        warehouseId: d.warehouseId,
        organizationId: org.id,
        items: {
          create: d.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            deliveredQty: d.status === "delivered" ? it.quantity : Math.floor(it.quantity / 2),
            unitPrice: it.unitPrice,
            total: it.quantity * it.unitPrice,
          })),
        },
      },
    })
    // Add tracking timeline entries
    const trackingEntries: { status: "packing" | "shipped" | "in_transit" | "delivered" | "failed"; location?: string; note?: string }[] = []
    if (d.status !== "draft" && d.status !== "cancelled") {
      trackingEntries.push({ status: "packing", location: "Warehouse", note: "Order picked and packed" })
      trackingEntries.push({ status: "shipped", location: "Outbound Hub", note: `Handed to ${d.carrier}` })
      trackingEntries.push({ status: "in_transit", location: "In Transit", note: "Package in transit to destination" })
      if (d.status === "delivered") {
        trackingEntries.push({ status: "delivered", location: "Destination", note: "Delivered successfully" })
      } else if (d.status === "failed") {
        trackingEntries.push({ status: "failed", location: "Sorting Center", note: "Package damaged in transit" })
      }
    }
    if (trackingEntries.length > 0) {
      await prisma.deliveryTracking.createMany({
        data: trackingEntries.map((t, idx) => ({
          status: t.status,
          location: t.location,
          note: t.note,
          timestamp: new Date(d.estimatedDate.getTime() - (trackingEntries.length - idx) * 86400000),
          deliveryId: d.id,
        })),
      })
    }
  }
  console.log(`  Deliveries: ${delData.length}`)

  // ── DELIVERIES (extra 10) ──
  const extraDelData = Array.from({ length: 10 }, (_, i) => {
    const j = i + 15
    const status = delStatuses[j % delStatuses.length]
    const distIdx = j % 8
    const whIdx = (j + 2) % 5
    const items = [
      { productId: products[(j + 2) % 10].id, quantity: (j % 5) + 3, unitPrice: products[(j + 2) % 10].unitPrice },
      { productId: products[(j + 5) % 10].id, quantity: (j % 3) + 1, unitPrice: products[(j + 5) % 10].unitPrice },
      { productId: products[(j + 7) % 10].id, quantity: (j % 4) + 2, unitPrice: products[(j + 7) % 10].unitPrice },
    ]
    const totalItems = items.reduce((s, it) => s + it.quantity, 0)
    const totalValue = items.reduce((s, it) => s + it.quantity * it.unitPrice, 0)
    const estDate = new Date(2025, 2, 10 + j * 2)
    const actualDate = status === "delivered" ? new Date(estDate.getTime() + 86400000 * 3) : null
    return {
      id: `del-${j + 1}`,
      number: `DEL-2025-${String(j + 1).padStart(3, "0")}`,
      status,
      trackingNumber: status !== "draft" && status !== "cancelled" ? `TRK${String(2000 + j)}` : null,
      carrier: ["DHL", "FedEx", "Kerry", "Flash", "J&T"][j % 5],
      estimatedDate: estDate,
      actualDate,
      notes: status === "failed" ? "Recipient not available" : null,
      origin: ["Southern Depot, Surat Thani", "Eastern Distribution, Chonburi"][j % 2],
      destination: [distData[distIdx].address, distData[distIdx].territory].filter(Boolean).join(", "),
      totalItems,
      totalValue,
      distributorId: distributors[distIdx].id,
      warehouseId: warehouses[whIdx].id,
      items,
    }
  })

  for (const d of extraDelData) {
    const existing = await prisma.delivery.findFirst({ where: { id: d.id } })
    if (existing) continue
    await prisma.delivery.create({
      data: {
        id: d.id, number: d.number, status: d.status,
        trackingNumber: d.trackingNumber, carrier: d.carrier,
        estimatedDate: d.estimatedDate, actualDate: d.actualDate,
        notes: d.notes, origin: d.origin, destination: d.destination,
        totalItems: d.totalItems, totalValue: d.totalValue,
        distributorId: d.distributorId, warehouseId: d.warehouseId,
        organizationId: org.id,
        items: {
          create: d.items.map((it) => ({
            productId: it.productId, quantity: it.quantity,
            deliveredQty: d.status === "delivered" ? it.quantity : Math.floor(it.quantity / 3),
            unitPrice: it.unitPrice, total: it.quantity * it.unitPrice,
          })),
        },
      },
    })
    const trackEntries: { status: "packing" | "shipped" | "in_transit" | "delivered" | "failed"; location?: string; note?: string }[] = []
    if (d.status !== "draft" && d.status !== "cancelled") {
      trackEntries.push({ status: "packing", location: "Warehouse", note: "Order picked and packed" })
      trackEntries.push({ status: "shipped", location: "Outbound Hub", note: `Handed to ${d.carrier}` })
      trackEntries.push({ status: "in_transit", location: "In Transit", note: "Package in transit" })
      if (d.status === "delivered") trackEntries.push({ status: "delivered", location: "Destination", note: "Delivered successfully" })
      else if (d.status === "failed") trackEntries.push({ status: "failed", location: "Local Hub", note: "Delivery failed" })
    }
    if (trackEntries.length > 0) {
      await prisma.deliveryTracking.createMany({
        data: trackEntries.map((t, idx) => ({
          status: t.status, location: t.location, note: t.note,
          timestamp: new Date(d.estimatedDate.getTime() - (trackEntries.length - idx) * 86400000),
          deliveryId: d.id,
        })),
      })
    }
  }
  console.log(`  Deliveries (extra): ${extraDelData.length}`)

  // ── STOCK COUNTS (5) ──
  const scStatuses = ["completed", "in_progress", "draft", "completed", "cancelled"] as const
  for (let i = 0; i < 5; i++) {
    const wh = warehouses[i % 5]
    const existing = await prisma.stockCount.findFirst({ where: { id: `sc-${i + 1}` } })
    if (existing) continue
    const productsInWh = products.filter((p) => p.warehouseId === wh.id)
    const usedProducts = productsInWh.length > 0 ? productsInWh : products.slice(i * 2, i * 2 + 2)
    const items = usedProducts.map((p) => {
      const expected = p.stock
      const discrepancy = i >= 3 ? Math.floor(Math.random() * 5) * (i % 2 === 0 ? 1 : -1) : 0
      return {
        productId: p.id,
        expectedQty: expected,
        actualQty: Math.max(0, expected + discrepancy),
        difference: discrepancy,
        notes: discrepancy !== 0 ? "Count discrepancy found" : null,
      }
    })
    const totalItems = items.length
    const matchedItems = items.filter((it) => it.difference === 0).length
    const discrepancyItems = items.filter((it) => it.difference !== 0).length
    const status = scStatuses[i]
    await prisma.stockCount.create({
      data: {
        id: `sc-${i + 1}`,
        number: `SC-2025-${String(i + 1).padStart(3, "0")}`,
        status,
        countDate: new Date(2025, 0, 10 + i * 7),
        totalItems,
        matchedItems,
        discrepancyItems,
        notes: discrepancyItems > 0 ? "Discrepancies found during count" : "All items matched",
        warehouseId: wh.id,
        organizationId: org.id,
        items: {
          create: items.map((it) => ({
            productId: it.productId,
            expectedQty: it.expectedQty,
            actualQty: it.actualQty,
            difference: it.difference,
            notes: it.notes,
          })),
        },
      },
    })
  }
  console.log("  Stock Counts: 5")

  // ── STOCK COUNTS (extra 5) ──
  const extraScStatuses = ["completed", "completed", "in_progress", "draft", "completed"] as const
  for (let i = 0; i < 5; i++) {
    const scIdx = i + 5
    const wh = warehouses[(i + 2) % 5]
    const existing = await prisma.stockCount.findFirst({ where: { id: `sc-${scIdx + 1}` } })
    if (existing) continue
    const productsInWh = products.filter((p) => p.warehouseId === wh.id)
    const usedProducts = productsInWh.length >= 2 ? productsInWh : products.slice((i + 2) * 2 % 8, (i + 2) * 2 % 8 + 3)
    const items = usedProducts.map((p) => {
      const expected = p.stock + Math.floor(Math.random() * 20)
      const discrepancy = i >= 2 && i < 4 ? (Math.floor(Math.random() * 3) + 1) * (i % 2 === 0 ? 1 : -1) : 0
      return {
        productId: p.id, expectedQty: expected,
        actualQty: Math.max(0, expected + discrepancy),
        difference: discrepancy,
        notes: discrepancy !== 0 ? "Discrepancy found" : null,
      }
    })
    const totalItems = items.length
    const matchedItems = items.filter((it) => it.difference === 0).length
    const discrepancyItems = items.filter((it) => it.difference !== 0).length
    const status = extraScStatuses[i]
    await prisma.stockCount.create({
      data: {
        id: `sc-${scIdx + 1}`,
        number: `SC-2025-${String(scIdx + 1).padStart(3, "0")}`,
        status,
        countDate: new Date(2025, 3, 10 + i * 10),
        totalItems, matchedItems, discrepancyItems,
        notes: discrepancyItems > 0 ? "Some discrepancies found" : "All clear",
        warehouseId: wh.id,
        organizationId: org.id,
        items: { create: items.map((it) => ({ productId: it.productId, expectedQty: it.expectedQty, actualQty: it.actualQty, difference: it.difference, notes: it.notes })) },
      },
    })
  }
   console.log("  Stock Counts (extra): 5")

  // ── WORK CENTERS (3) ──
  const wcData = [
    { id: "wc-assembly", code: "ASM-001", name: "Assembly Line 1", description: "Main product assembly line", costPerHour: 450, capacity: 50, location: "Building A, Floor 1", isActive: true },
    { id: "wc-paint", code: "PNT-001", name: "Paint & Finish", description: "Spray painting and surface finishing", costPerHour: 350, capacity: 30, location: "Building B, Floor 2", isActive: true },
    { id: "wc-qc", code: "QC-001", name: "Quality Control", description: "Inspection and testing station", costPerHour: 500, capacity: 20, location: "Building A, Floor 3", isActive: true },
  ]
  await Promise.all(wcData.map((wc) =>
    prisma.workCenter.upsert({ where: { id: wc.id }, update: {}, create: { ...wc, organizationId: org.id } })
  ))
  console.log("  Work Centers: 3")

  // ── PRODUCTION ORDERS (4) ──
  const poData = [
    {
      id: "po-1", number: "MO-2025-001", status: "in_progress" as const, productId: products[0].id,
      quantity: 20, producedQty: 12, startDate: new Date("2025-03-01"), dueDate: new Date("2025-03-15"),
      notes: "Priority order for Somchai Electronics", warehouseId: warehouses[0].id,
      materials: [
        { productId: products[7].id, quantityNeeded: 20, quantityIssued: 20 },
        { productId: products[8].id, quantityNeeded: 20, quantityIssued: 20 },
      ],
      operations: [
        { sequence: 1, name: "PCB Assembly", setupTime: 30, runTime: 15, workCenterId: "wc-assembly" },
        { sequence: 2, name: "Battery Installation", setupTime: 15, runTime: 10, workCenterId: "wc-assembly" },
        { sequence: 3, name: "Quality Check", setupTime: 5, runTime: 5, workCenterId: "wc-qc" },
      ],
    },
    {
      id: "po-2", number: "MO-2025-002", status: "confirmed" as const, productId: products[3].id,
      quantity: 10, producedQty: 0, startDate: new Date("2025-03-10"), dueDate: new Date("2025-03-20"),
      notes: null, warehouseId: warehouses[0].id,
      materials: [
        { productId: products[9].id, quantityNeeded: 20, quantityIssued: 0 },
      ],
      operations: [
        { sequence: 1, name: "Frame Assembly", setupTime: 45, runTime: 20, workCenterId: "wc-assembly" },
        { sequence: 2, name: "Surface Finish", setupTime: 20, runTime: 15, workCenterId: "wc-paint" },
        { sequence: 3, name: "Final QC", setupTime: 10, runTime: 8, workCenterId: "wc-qc" },
      ],
    },
    {
      id: "po-3", number: "MO-2025-003", status: "draft" as const, productId: products[4].id,
      quantity: 15, producedQty: 0, startDate: null, dueDate: new Date("2025-04-01"),
      notes: "Awaiting material stock", warehouseId: warehouses[0].id,
      materials: [],
      operations: [
        { sequence: 1, name: "Chair Assembly", setupTime: 25, runTime: 12, workCenterId: "wc-assembly" },
      ],
    },
    {
      id: "po-4", number: "MO-2025-004", status: "completed" as const, productId: products[5].id,
      quantity: 5, producedQty: 5, startDate: new Date("2025-02-15"), dueDate: new Date("2025-02-25"),
      completedDate: new Date("2025-02-23"), notes: "All tests passed", warehouseId: warehouses[1].id,
      materials: [
        { productId: products[7].id, quantityNeeded: 3, quantityIssued: 3 },
      ],
      operations: [
        { sequence: 1, name: "PCB Populate", setupTime: 20, runTime: 10, workCenterId: "wc-assembly" },
        { sequence: 2, name: "Firmware Flash", setupTime: 10, runTime: 5, workCenterId: "wc-qc" },
      ],
    },
  ]
  for (const po of poData) {
    const existing = await prisma.productionOrder.findFirst({ where: { id: po.id } })
    if (!existing) {
      await prisma.productionOrder.create({
        data: {
          id: po.id,
          number: po.number,
          status: po.status,
          productId: po.productId,
          quantity: po.quantity,
          producedQty: po.producedQty,
          startDate: po.startDate,
          dueDate: po.dueDate,
          completedDate: (po as any).completedDate || null,
          notes: po.notes,
          warehouseId: po.warehouseId,
          organizationId: org.id,
          ...(po.materials.length > 0 ? { materials: { create: po.materials } } : {}),
          operations: { create: po.operations.map((op) => ({ sequence: op.sequence, name: op.name, setupTime: op.setupTime, runTime: op.runTime, workCenterId: op.workCenterId })) },
        },
      })
    }
  }
  console.log("  Production Orders: 4")

  // ── ACCOUNT GROUPS (8) ──
  const groupData = [
    { id: "grp-ca", name: "Current Assets", type: "asset" as const, code: "1000" },
    { id: "grp-fa", name: "Fixed Assets", type: "asset" as const, code: "1500" },
    { id: "grp-cl", name: "Current Liabilities", type: "liability" as const, code: "2000" },
    { id: "grp-lt", name: "Long-term Liabilities", type: "liability" as const, code: "2500" },
    { id: "grp-eq", name: "Equity", type: "equity" as const, code: "3000" },
    { id: "grp-rev", name: "Revenue", type: "revenue" as const, code: "4000" },
    { id: "grp-cogs", name: "Cost of Goods Sold", type: "expense" as const, code: "5000" },
    { id: "grp-ope", name: "Operating Expenses", type: "expense" as const, code: "5500" },
  ]
  const groups = await Promise.all(groupData.map((g) =>
    prisma.accountGroup.upsert({ where: { id: g.id }, update: {}, create: { ...g, organizationId: org.id } })
  ))
  console.log("  Account Groups: 8")

  // ── CHART OF ACCOUNTS (15) ──
  const accountData = [
    { id: "acct-cash", code: "1100", name: "Cash", type: "asset" as const, groupId: "grp-ca", openingBalance: 500000 },
    { id: "acct-bank", code: "1200", name: "Bank Account", type: "asset" as const, groupId: "grp-ca", openingBalance: 2500000 },
    { id: "acct-ar", code: "1300", name: "Accounts Receivable", type: "asset" as const, groupId: "grp-ca", openingBalance: 800000 },
    { id: "acct-inv", code: "1400", name: "Inventory", type: "asset" as const, groupId: "grp-ca", openingBalance: 1500000 },
    { id: "acct-equip", code: "1600", name: "Equipment", type: "asset" as const, groupId: "grp-fa", openingBalance: 3000000 },
    { id: "acct-ap", code: "2100", name: "Accounts Payable", type: "liability" as const, groupId: "grp-cl", openingBalance: -400000 },
    { id: "acct-vat", code: "2200", name: "VAT Payable", type: "liability" as const, groupId: "grp-cl", openingBalance: -150000 },
    { id: "acct-loan", code: "2600", name: "Bank Loan", type: "liability" as const, groupId: "grp-lt", openingBalance: -2000000 },
    { id: "acct-cap", code: "3100", name: "Owner's Capital", type: "equity" as const, groupId: "grp-eq", openingBalance: -5000000 },
    { id: "acct-ret", code: "3200", name: "Retained Earnings", type: "equity" as const, groupId: "grp-eq", openingBalance: -750000 },
    { id: "acct-sales", code: "4100", name: "Sales Revenue", type: "revenue" as const, groupId: "grp-rev" },
    { id: "acct-other-rev", code: "4200", name: "Other Revenue", type: "revenue" as const, groupId: "grp-rev" },
    { id: "acct-cogs", code: "5100", name: "Cost of Goods Sold", type: "expense" as const, groupId: "grp-cogs" },
    { id: "acct-salaries", code: "5600", name: "Salaries & Wages", type: "expense" as const, groupId: "grp-ope" },
    { id: "acct-rent", code: "5700", name: "Rent & Utilities", type: "expense" as const, groupId: "grp-ope" },
  ]
  for (const a of accountData) {
    await prisma.chartOfAccount.upsert({
      where: { id: a.id },
      update: {},
      create: { ...a, currentBalance: a.openingBalance || 0, organizationId: org.id },
    })
  }
  console.log("  Chart of Accounts: 15")

  // ── TAX RATES (4) ──
  const taxData = [
    { id: "tax-vat-7", name: "VAT 7%", rate: 7, type: "vat", isDefault: true },
    { id: "tax-vat-0", name: "VAT 0%", rate: 0, type: "vat", isDefault: false },
    { id: "tax-wht-3", name: "Withholding Tax 3%", rate: 3, type: "withholding", isDefault: true },
    { id: "tax-wht-5", name: "Withholding Tax 5%", rate: 5, type: "withholding", isDefault: false },
  ]
  for (const t of taxData) {
    await prisma.taxRate.upsert({ where: { id: t.id }, update: {}, create: { ...t, organizationId: org.id } })
  }
  console.log("  Tax Rates: 4")

  // ── KNOWLEDGE: Wiki Articles (25) ──
  const articleData = [
    { id: "1", title: "How to add a new product", category: "Inventory", excerpt: "Step-by-step guide on creating products in Ins.", content: "To add a new product, navigate to Products and click 'Add Product'..." },
    { id: "2", title: "Understanding stock movements", category: "Inventory", excerpt: "Track ins and outs of your inventory.", content: "Stock movements track every change in inventory levels..." },
    { id: "3", title: "Creating sales orders", category: "Orders", excerpt: "Learn how to create and manage sales orders.", content: "Sales orders can be created from the Orders page..." },
    { id: "4", title: "Managing purchase orders", category: "Orders", excerpt: "Procurement workflow from PO to receipt.", content: "Purchase orders (POs) are created to order goods..." },
    { id: "5", title: "Customer management guide", category: "CRM", excerpt: "Best practices for managing customer relationships.", content: "The CRM module helps you manage customer interactions..." },
  ]
  for (const a of articleData) {
    await prisma.wikiArticle.upsert({ where: { id: a.id }, update: {}, create: { ...a, author: "Admin", updated: "1 week ago", readTime: "4 min", organizationId: org.id } })
  }
  console.log("  Wiki Articles: 5")

  // ── KNOWLEDGE: Documents (10) ──
  const docData = [
    { id: "1", name: "PO-2024-001.pdf", type: "PO", fileType: "pdf", size: "245 KB", relatedTo: "Order #ORD-001" },
    { id: "2", name: "INV-2024-001.pdf", type: "Invoice", fileType: "pdf", size: "180 KB", relatedTo: "Order #ORD-001" },
    { id: "3", name: "Monthly_Report_Jan.xlsx", type: "Report", fileType: "spreadsheet", size: "1.2 MB" },
    { id: "4", name: "Delivery_Note_001.pdf", type: "Delivery Note", fileType: "pdf", size: "320 KB", relatedTo: "Order #ORD-002" },
    { id: "5", name: "Product_Photos.zip", type: "Other", fileType: "archive", size: "15 MB", relatedTo: "Product SKU-004" },
    { id: "6", name: "Invoice_2024_002.pdf", type: "Invoice", fileType: "pdf", size: "210 KB", relatedTo: "Order #ORD-003" },
    { id: "7", name: "Inventory_Count.xlsx", type: "Report", fileType: "spreadsheet", size: "890 KB" },
    { id: "8", name: "Quality_Audit_Report.pdf", type: "Report", fileType: "pdf", size: "4.8 MB" },
    { id: "9", name: "Supplier_Agreement_ACM.pdf", type: "Other", fileType: "pdf", size: "1.8 MB", relatedTo: "Supplier SUP-001" },
    { id: "10", name: "Q1_Sales_Report.pdf", type: "Report", fileType: "pdf", size: "2.1 MB" },
  ]
  for (const d of docData) {
    await prisma.knowledgeDocument.upsert({ where: { id: d.id }, update: {}, create: { ...d, uploadedBy: "Admin", uploadedAt: "2024-01-15", organizationId: org.id } })
  }
  console.log("  Knowledge Documents: 10")

  // ── KNOWLEDGE: Training Programs (10) ──
  const progData = [
    { id: "1", title: "Inventory Management Basics", type: "Course", level: "Beginner", modules: 6, duration: "2 hours", students: 24, progress: 100, description: "Learn the fundamentals of inventory tracking and stock management." },
    { id: "2", title: "Order Processing Workshop", type: "Workshop", level: "Intermediate", modules: 4, duration: "1.5 hours", students: 18, progress: 65, description: "Hands-on training for creating and managing orders." },
    { id: "3", title: "CRM Mastery", type: "Course", level: "Intermediate", modules: 8, duration: "4 hours", students: 12, progress: 30, description: "Deep dive into customer relationship management features." },
    { id: "4", title: "Report & Analytics Guide", type: "Video", level: "Advanced", modules: 3, duration: "45 min", students: 8, progress: 0, description: "Advanced reporting techniques and data-driven decision making." },
    { id: "5", title: "Getting Started with Ins", type: "Course", level: "Beginner", modules: 5, duration: "1 hour", students: 30, progress: 80, description: "A comprehensive introduction to the Ins platform." },
    { id: "6", title: "Procurement Best Practices", type: "Video", level: "Advanced", modules: 4, duration: "1 hour", students: 6, progress: 10, description: "Optimize your procurement workflow with proven strategies." },
    { id: "7", title: "Warehouse Safety Guidelines", type: "Course", level: "Beginner", modules: 4, duration: "1.5 hours", students: 20, progress: 100, description: "Essential safety protocols for warehouse operations." },
    { id: "8", title: "Supplier Relationship Management", type: "Course", level: "Intermediate", modules: 5, duration: "2.5 hours", students: 10, progress: 15, description: "Build and maintain strong partnerships with your suppliers." },
    { id: "9", title: "Data Security Best Practices", type: "Workshop", level: "Beginner", modules: 4, duration: "1.5 hours", students: 16, progress: 70, description: "Protect company data and prevent security breaches." },
    { id: "10", title: "Introduction to Forecasting", type: "Course", level: "Beginner", modules: 4, duration: "1.5 hours", students: 19, progress: 85, description: "Basic demand forecasting methods for inventory planning." },
  ]
  for (const p of progData) {
    await prisma.trainingProgram.upsert({ where: { id: p.id }, update: {}, create: { ...p, organizationId: org.id } })
  }
  console.log("  Training Programs: 10")

  // ── RBAC: System Roles (4) ──
  const permMatrix: Record<string, { create: string[]; read: string[]; update: string[]; delete: string[] }> = {
    products: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    materials: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    bom: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    orders: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    customers: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    suppliers: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    invoices: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    quotations: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    payments: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    categories: { create: ["owner", "admin"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    warehouses: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    settings: { create: ["owner"], read: ["owner", "admin"], update: ["owner"], delete: ["owner"] },
    accounts: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    journal: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    tax: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    projects: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin"], delete: ["owner"] },
    tasks: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member", "viewer"], update: ["owner", "admin", "member"], delete: ["owner"] },
    workflows: { create: ["owner", "admin"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    roles: { create: ["owner"], read: ["owner", "admin"], update: ["owner"], delete: ["owner"] },
    apiKeys: { create: ["owner", "admin"], read: ["owner", "admin"], update: ["owner", "admin"], delete: ["owner"] },
    auditLogs: { create: ["owner", "admin", "member"], read: ["owner", "admin", "member"], update: ["owner", "admin"], delete: ["owner"] },
    users: { create: ["owner"], read: ["owner", "admin"], update: ["owner"], delete: ["owner"] },
  }
  const entities = Object.keys(permMatrix)
  const actions = ["create", "read", "update", "delete"] as const
  const roleNames = ["owner", "admin", "member", "viewer"]
  for (const roleName of roleNames) {
    const perms: Record<string, Record<string, boolean>> = {}
    for (const entity of entities) {
      const entityPerms: Record<string, boolean> = {}
      for (const action of actions) {
        entityPerms[action] = permMatrix[entity][action].includes(roleName)
      }
      perms[entity] = entityPerms
    }
    await prisma.role.upsert({
      where: { name_organizationId: { name: roleName, organizationId: org.id } },
      update: { permissions: JSON.stringify(perms) },
      create: { name: roleName, description: `System ${roleName} role`, permissions: JSON.stringify(perms), isSystem: true, organizationId: org.id },
    })
  }
  console.log("  System Roles: 4")

  // ── API Keys (1 sample) ──
  await prisma.apiKey.upsert({
    where: { keyHash: "sk_sample_hash_ins_demo" },
    update: {},
    create: {
      name: "Sample API Key",
      keyHash: "sk_sample_hash_ins_demo",
      keyPrefix: "sk_sample",
      permissions: JSON.stringify({ "*": { read: true } }),
      userId: user.id,
      organizationId: org.id,
    },
  })
  console.log("  API Keys: 1")

  // ── Audit Entries (2 samples) ──
  await prisma.auditEntry.createMany({
    data: [
      { action: "seed", entity: "system", entityId: "init", description: "Database seeded with demo data", userId: user.id, organizationId: org.id },
    ],
  })
  console.log("  Audit Entries: 1")

  // ── PROJECTS (3) ──
  const projData = [
    { id: "proj-1", name: "Q1 2025 Inventory Optimization", description: "Optimize inventory levels across all warehouses using demand forecasting", status: "active" as const, priority: "high", startDate: new Date("2025-01-15"), dueDate: new Date("2025-03-31"), budget: 250000, actualCost: 180000 },
    { id: "proj-2", name: "Supplier Onboarding Portal", description: "Build self-service portal for supplier registration and document management", status: "active" as const, priority: "medium", startDate: new Date("2025-02-01"), dueDate: new Date("2025-04-30"), budget: 500000, actualCost: 120000 },
    { id: "proj-3", name: "Warehouse Automation", description: "Implement automated picking system in Main Warehouse", status: "draft" as const, priority: "low", startDate: null, dueDate: new Date("2025-06-30"), budget: 2000000, actualCost: 0 },
  ]
  for (const p of projData) {
    await prisma.project.upsert({ where: { id: p.id }, update: {}, create: { ...p, organizationId: org.id } })
  }
  console.log("  Projects: 3")

  // ── TASKS (8) ──
  const taskData = [
    { title: "Audit current stock levels", status: "done" as const, priority: "high", projectId: "proj-1", dueDate: new Date("2025-01-31"), estimatedHours: 16, actualHours: 14 },
    { title: "Implement min/max reorder points", status: "in_progress" as const, priority: "high", projectId: "proj-1", dueDate: new Date("2025-02-28"), estimatedHours: 24, actualHours: 10 },
    { title: "Train staff on new inventory system", status: "todo" as const, priority: "medium", projectId: "proj-1", dueDate: new Date("2025-03-15"), estimatedHours: 8, actualHours: 0 },
    { title: "Design supplier registration form", status: "done" as const, priority: "medium", projectId: "proj-2", dueDate: new Date("2025-02-15"), estimatedHours: 12, actualHours: 12 },
    { title: "Develop document upload API", status: "in_progress" as const, priority: "high", projectId: "proj-2", dueDate: new Date("2025-03-15"), estimatedHours: 32, actualHours: 20 },
    { title: "Test portal with pilot suppliers", status: "todo" as const, priority: "medium", projectId: "proj-2", dueDate: new Date("2025-04-15"), estimatedHours: 16, actualHours: 0 },
    { title: "Research robotic picking systems", status: "todo" as const, priority: "low", projectId: "proj-3", dueDate: new Date("2025-04-30"), estimatedHours: 8, actualHours: 0 },
    { title: "Prepare warehouse layout redesign", status: "todo" as const, priority: "low", projectId: "proj-3", dueDate: new Date("2025-05-30"), estimatedHours: 24, actualHours: 0 },
  ]
  await Promise.all(taskData.map((t) =>
    prisma.task.create({ data: { ...t, organizationId: org.id } })
  ))
  console.log("  Tasks: 8")

  // ── JOURNAL ENTRIES (5) ──
  const acct = await prisma.chartOfAccount.findMany({ where: { organizationId: org.id } })
  const acctMap = Object.fromEntries(acct.map((a) => [a.code, a.id]))
  const jeData = [
    {
      number: "JE-2025-001", date: new Date("2025-01-31"), description: "Monthly sales revenue recognition", referenceType: "order",
      lines: [
        { accountCode: "1100", debit: 0, credit: 83500 },
        { accountCode: "4100", debit: 83500, credit: 0 },
      ],
    },
    {
      number: "JE-2025-002", date: new Date("2025-02-15"), description: "Supplier payment for PO-2025-001", referenceType: "payment",
      lines: [
        { accountCode: "2100", debit: 380000, credit: 0 },
        { accountCode: "1100", debit: 0, credit: 380000 },
      ],
    },
    {
      number: "JE-2025-003", date: new Date("2025-02-28"), description: "Monthly depreciation", referenceType: null,
      lines: [
        { accountCode: "5600", debit: 25000, credit: 0 },
        { accountCode: "1600", debit: 0, credit: 25000 },
      ],
    },
    {
      number: "JE-2025-004", date: new Date("2025-03-15"), description: "Inventory adjustment - stock count variance", referenceType: "adjustment",
      lines: [
        { accountCode: "5100", debit: 15000, credit: 0 },
        { accountCode: "1400", debit: 0, credit: 15000 },
      ],
    },
    {
      number: "JE-2025-005", date: new Date("2025-03-31"), description: "Quarterly tax accrual", referenceType: "tax",
      lines: [
        { accountCode: "5600", debit: 45000, credit: 0 },
        { accountCode: "2200", debit: 0, credit: 45000 },
      ],
    },
  ]
  for (const je of jeData) {
    const totalDebit = je.lines.reduce((s, l) => s + l.debit, 0)
    const totalCredit = je.lines.reduce((s, l) => s + l.credit, 0)
    await prisma.journalEntry.create({
      data: {
        number: je.number, date: je.date, description: je.description,
        referenceType: je.referenceType, totalDebit, totalCredit, status: "posted",
        organizationId: org.id,
        lines: { create: je.lines.map((l) => ({ accountId: acctMap[l.accountCode], debit: l.debit, credit: l.credit, description: je.description })) },
      },
    })
  }
  console.log("  Journal Entries: 5")

  console.log("\n✓ Seed complete!")
  console.log("  Login: admin@ins.com / password123")
  console.log("  Entities: 8 categories · 5 warehouses · 5 suppliers · 5 customers · 10 products · 5 lots · 5 BOMs · 5 orders · 5 quotations · 5 invoices · 5 payments · 5 forecast entries · 8 distributors · 15 deliveries · 5 stock counts · 3 work centers · 4 production orders · 8 account groups · 15 COA accounts · 4 tax rates · 5 wiki articles · 10 knowledge docs · 10 training programs · 4 system roles · 1 API key · 1 audit entry")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(async () => { await prisma.$disconnect() })
