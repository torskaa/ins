-- AlterTable: add usage tracking fields to AiExecutionLog
ALTER TABLE "AiExecutionLog" ADD COLUMN "action" TEXT NOT NULL DEFAULT 'tool_execution';
ALTER TABLE "AiExecutionLog" ADD COLUMN "agentId" TEXT;
ALTER TABLE "AiExecutionLog" ADD COLUMN "provider" TEXT;
ALTER TABLE "AiExecutionLog" ADD COLUMN "model" TEXT;
ALTER TABLE "AiExecutionLog" ADD COLUMN "inputTokens" INTEGER;
ALTER TABLE "AiExecutionLog" ADD COLUMN "outputTokens" INTEGER;
