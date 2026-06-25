# Ins — AI-Native ERP Operating System

Ins is a modern, AI-native ERP system built for small to medium businesses. It combines inventory management, order processing, CRM, manufacturing, finance, and project management — all powered by an intelligent AI agent layer.

## Features

- **Inventory Management** — Products, warehouses, stock movements, BOM, MRP
- **Sales & Procurement** — Orders, quotations, invoices, payments
- **CRM** — Customers, distributors, deliveries
- **Manufacturing** — Production orders, work centers, operations
- **Finance** — Chart of accounts, journal entries, tax management
- **Project Management** — Projects, tasks, workflows
- **Knowledge Hub** — Wiki, training, document management
- **AI Agents** — Intelligent automation across all modules
- **Multi-tenant** — Organization-scoped with RBAC
- **i18n** — English & Thai support

## Tech Stack

- **Framework:** Next.js 16, React 19
- **Language:** TypeScript (strict mode)
- **Database:** SQLite (dev) / PostgreSQL (production)
- **ORM:** Prisma
- **Auth:** NextAuth v5 (JWT) with Google, GitHub, Credentials
- **UI:** Radix UI, Tailwind CSS 4, shadcn/ui
- **Payments:** Stripe
- **Monitoring:** Sentry
- **AI:** Multi-agent system with MCP tools

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Run database migration
npx prisma migrate dev

# Seed demo data
npm run db:seed

# Start development server
npm run dev
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | Run TypeScript check |
| `npm run test` | Run tests |
| `npm run format` | Format code with Prettier |
| `npm run ci` | Full CI pipeline (typecheck + lint + test + build) |

## Environment Variables

See `.env.example` for all available configuration options.

## Deployment

### Docker

```bash
docker compose up --build
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new)

## License

MIT
