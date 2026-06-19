-- CreateTable
CREATE TABLE "ConsentToken" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "token" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "LedgerEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT NOT NULL,
    "brandId" TEXT NOT NULL,
    "auditHash" TEXT,
    "audienceSize" INTEGER,
    "amount" REAL,
    "tokenRef" TEXT
);

-- CreateTable
CREATE TABLE "ConsentSetting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL DEFAULT 'consumer_001',
    "brandId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "ConsentToken_token_key" ON "ConsentToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ConsentSetting_userId_brandId_category_key" ON "ConsentSetting"("userId", "brandId", "category");
