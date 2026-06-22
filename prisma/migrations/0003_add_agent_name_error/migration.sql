-- AlterTable
ALTER TABLE "AgentRun" ADD COLUMN "agentName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "AgentRun" ADD COLUMN "error" TEXT;
