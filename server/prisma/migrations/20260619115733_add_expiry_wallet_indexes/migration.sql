-- AlterTable
ALTER TABLE "ConsentToken" ADD COLUMN "expiresAt" DATETIME;

-- CreateTable
CREATE TABLE "WalletTransaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT 'consumer_001',
    "brandId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "WalletTransaction_transactionId_key" ON "WalletTransaction"("transactionId");

-- CreateIndex
CREATE INDEX "LedgerEntry_brandId_idx" ON "LedgerEntry"("brandId");

-- CreateIndex
CREATE INDEX "LedgerEntry_timestamp_idx" ON "LedgerEntry"("timestamp");
