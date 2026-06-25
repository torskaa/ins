import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

type OrgInfo = { id: string; name: string; slug: string }

export async function getCurrentOrganization(): Promise<OrgInfo | null> {
  const session = await auth()
  if (!session?.user?.id) return null

  const userId = session.user.id
  const activeOrgId = (session.user as unknown as { activeOrganizationId?: string }).activeOrganizationId

  const membership = activeOrgId
    ? await prisma.organizationMember.findFirst({
        where: { userId, organizationId: activeOrgId },
        include: { organization: true },
      })
    : null

  const result = membership ?? (await prisma.organizationMember.findFirst({
    where: { userId },
    include: { organization: true },
  }))

  if (!result) return null

  return {
    id: result.organization.id,
    name: result.organization.name,
    slug: result.organization.slug,
  }
}

export async function createOrganizationForUser(userId: string) {
  const org = await prisma.organization.create({
    data: {
      name: "My Company",
      slug: `company-${userId.slice(0, 6)}`,
      settings: { create: {} },
    },
  })
  await prisma.organizationMember.create({
    data: { userId, organizationId: org.id, role: "owner" },
  })
  return { id: org.id, name: org.name, slug: org.slug }
}

export async function ensureUserHasOrganization(): Promise<OrgInfo> {
  const session = await auth()

  if (!session?.user?.id) {
    return createOrganizationForUser("anonymous")
  }

  const membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  })

  if (membership) {
    return {
      id: membership.organization.id,
      name: membership.organization.name,
      slug: membership.organization.slug,
    }
  }

  return createOrganizationForUser(session.user.id)
}
