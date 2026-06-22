-- CreateTable
CREATE TABLE "AiExecutionLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "input" TEXT NOT NULL,
    "output" TEXT,
    "status" TEXT NOT NULL DEFAULT 'success',
    "errorMessage" TEXT,
    "durationMs" INTEGER,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AiExecutionLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "agentId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'idle',
    "summary" TEXT,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AgentRun_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentStep" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "input" TEXT NOT NULL,
    "output" TEXT,
    "durationMs" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AgentStep_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AgentApproval" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "runId" TEXT NOT NULL,
    "toolName" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requestedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" DATETIME,
    "resolvedBy" TEXT,
    CONSTRAINT "AgentApproval_runId_fkey" FOREIGN KEY ("runId") REFERENCES "AgentRun" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_KnowledgeDocument" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'Other',
    "fileType" TEXT NOT NULL DEFAULT 'pdf',
    "size" TEXT NOT NULL DEFAULT '0 KB',
    "filePath" TEXT NOT NULL DEFAULT '',
    "uploadedBy" TEXT NOT NULL DEFAULT 'Admin',
    "uploadedAt" TEXT NOT NULL,
    "relatedTo" TEXT,
    "notes" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "KnowledgeDocument_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_KnowledgeDocument" ("createdAt", "fileType", "id", "name", "notes", "organizationId", "relatedTo", "size", "type", "updatedAt", "uploadedAt", "uploadedBy") SELECT "createdAt", "fileType", "id", "name", "notes", "organizationId", "relatedTo", "size", "type", "updatedAt", "uploadedAt", "uploadedBy" FROM "KnowledgeDocument";
DROP TABLE "KnowledgeDocument";
ALTER TABLE "new_KnowledgeDocument" RENAME TO "KnowledgeDocument";
CREATE TABLE "new_OrganizationSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "currency" TEXT NOT NULL DEFAULT 'THB',
    "taxRate" REAL NOT NULL DEFAULT 7,
    "dateFormat" TEXT NOT NULL DEFAULT 'DD/MM/YYYY',
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Bangkok',
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 10,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "planId" TEXT NOT NULL DEFAULT 'free',
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "OrganizationSetting_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OrganizationSetting" ("createdAt", "currency", "dateFormat", "id", "lowStockThreshold", "organizationId", "taxRate", "timezone", "updatedAt") SELECT "createdAt", "currency", "dateFormat", "id", "lowStockThreshold", "organizationId", "taxRate", "timezone", "updatedAt" FROM "OrganizationSetting";
DROP TABLE "OrganizationSetting";
ALTER TABLE "new_OrganizationSetting" RENAME TO "OrganizationSetting";
CREATE UNIQUE INDEX "OrganizationSetting_organizationId_key" ON "OrganizationSetting"("organizationId");
CREATE TABLE "new_StockMovement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "description" TEXT,
    "reference" TEXT,
    "productId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "orderId" TEXT,
    "createdById" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lotId" TEXT,
    "deliveryId" TEXT,
    CONSTRAINT "StockMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_lotId_fkey" FOREIGN KEY ("lotId") REFERENCES "Lot" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "StockMovement_deliveryId_fkey" FOREIGN KEY ("deliveryId") REFERENCES "Delivery" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_StockMovement" ("createdAt", "createdById", "deliveryId", "description", "id", "lotId", "orderId", "productId", "quantity", "reference", "type", "warehouseId") SELECT "createdAt", "createdById", "deliveryId", "description", "id", "lotId", "orderId", "productId", "quantity", "reference", "type", "warehouseId" FROM "StockMovement";
DROP TABLE "StockMovement";
ALTER TABLE "new_StockMovement" RENAME TO "StockMovement";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "AiExecutionLog_userId_createdAt_idx" ON "AiExecutionLog"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AiExecutionLog_organizationId_createdAt_idx" ON "AiExecutionLog"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AiExecutionLog_toolName_createdAt_idx" ON "AiExecutionLog"("toolName", "createdAt");

-- CreateIndex
CREATE INDEX "AgentRun_organizationId_createdAt_idx" ON "AgentRun"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentRun_userId_createdAt_idx" ON "AgentRun"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentRun_agentId_createdAt_idx" ON "AgentRun"("agentId", "createdAt");

-- CreateIndex
CREATE INDEX "AgentRun_status_idx" ON "AgentRun"("status");

-- CreateIndex
CREATE INDEX "AgentStep_runId_idx" ON "AgentStep"("runId");

-- CreateIndex
CREATE INDEX "AgentApproval_runId_idx" ON "AgentApproval"("runId");

-- CreateIndex
CREATE INDEX "AgentApproval_status_idx" ON "AgentApproval"("status");
