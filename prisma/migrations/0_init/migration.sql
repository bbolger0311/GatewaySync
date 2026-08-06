-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Portal" AS ENUM ('COUPA', 'ARIBA');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "clerkOrgId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortalConnection" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "connectedByUserId" TEXT,
    "portal" "Portal" NOT NULL,
    "externalAccountId" TEXT,
    "accessTokenCipher" TEXT NOT NULL,
    "refreshTokenCipher" TEXT,
    "tokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalConnection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseOrder" (
    "id" TEXT NOT NULL,
    "portalConnectionId" TEXT NOT NULL,
    "portal" "Portal" NOT NULL,
    "externalPoNumber" TEXT NOT NULL,
    "vendorName" TEXT,
    "description" TEXT,
    "requiredFields" JSONB NOT NULL,
    "rawData" JSONB NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceSubmission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "submittedByUserId" TEXT,
    "purchaseOrderId" TEXT NOT NULL,
    "portal" "Portal" NOT NULL,
    "submittedFields" JSONB NOT NULL,
    "attachmentUrl" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "portalMessage" TEXT,
    "portalResponse" JSONB,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InvoiceSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_clerkOrgId_key" ON "Organization"("clerkOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "PortalConnection_organizationId_portal_key" ON "PortalConnection"("organizationId", "portal");

-- CreateIndex
CREATE INDEX "PurchaseOrder_portal_externalPoNumber_idx" ON "PurchaseOrder"("portal", "externalPoNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PurchaseOrder_portalConnectionId_externalPoNumber_key" ON "PurchaseOrder"("portalConnectionId", "externalPoNumber");

-- CreateIndex
CREATE INDEX "InvoiceSubmission_organizationId_idx" ON "InvoiceSubmission"("organizationId");

-- CreateIndex
CREATE INDEX "InvoiceSubmission_status_idx" ON "InvoiceSubmission"("status");

-- AddForeignKey
ALTER TABLE "PortalConnection" ADD CONSTRAINT "PortalConnection_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_portalConnectionId_fkey" FOREIGN KEY ("portalConnectionId") REFERENCES "PortalConnection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSubmission" ADD CONSTRAINT "InvoiceSubmission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSubmission" ADD CONSTRAINT "InvoiceSubmission_submittedByUserId_fkey" FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceSubmission" ADD CONSTRAINT "InvoiceSubmission_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "PurchaseOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

