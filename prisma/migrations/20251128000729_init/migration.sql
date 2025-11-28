-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "serviceName" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentLinkUrl" TEXT NOT NULL,
    "stripeSessionId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_stripeSessionId_key" ON "Transaction"("stripeSessionId");
