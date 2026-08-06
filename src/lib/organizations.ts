import { prisma } from "@/lib/prisma";

export async function getOrganizationByClerkId(clerkOrgId: string) {
  return prisma.organization.findUnique({ where: { clerkOrgId } });
}

export async function getOrCreateOrganization(clerkOrgId: string) {
  return prisma.organization.upsert({
    where: { clerkOrgId },
    update: {},
    create: { clerkOrgId },
  });
}
