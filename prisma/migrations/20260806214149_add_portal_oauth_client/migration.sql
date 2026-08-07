-- CreateTable
CREATE TABLE "PortalOAuthClient" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "portal" "Portal" NOT NULL,
    "authorizeUrl" TEXT NOT NULL,
    "tokenUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecretCipher" TEXT NOT NULL,
    "scope" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PortalOAuthClient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PortalOAuthClient_organizationId_portal_key" ON "PortalOAuthClient"("organizationId", "portal");

-- AddForeignKey
ALTER TABLE "PortalOAuthClient" ADD CONSTRAINT "PortalOAuthClient_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
