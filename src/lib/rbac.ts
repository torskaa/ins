import { prisma } from "@/lib/db"
import { auth } from "@/lib/auth"

type OrgInfo = { id: string; name: string; slug: string } | null

export async function getCurrentOrganization(): Promise<OrgInfo> {
  const session = await auth()
  if (!session?.user?.id) return null

  const activeOrgId = (session as any).user?.activeOrganizationId as string | undefined

  const membership = activeOrgId
    ? await prisma.organizationMember.findFirst({
        where: { userId: session.user.id, organizationId: activeOrgId },
        include: { organization: true },
      })
    : null

  const result = membership || await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  })

  if (!result) return null

  return {
    id: result.organization.id,
    name: result.organization.name,
    slug: result.organization.slug,
  }
}

export async function ensureUserHasOrganization() {
  const session = await auth()
  if (!session?.user?.id) {
    const org = await prisma.organization.create({
      data: {
        name: "My Company",
        slug: "my-company",
        settings: { create: {} },
      },
    })
    return { id: org.id, name: org.name, slug: org.slug }
  }

  let membership = await prisma.organizationMember.findFirst({
    where: { userId: session.user.id },
    include: { organization: true },
  })

  if (!membership) {
    const org = await prisma.organization.create({
      data: {
        name: "My Company",
        slug: `company-${session.user.id.slice(0, 6)}`,
        settings: { create: {} },
      },
    })
    membership = await prisma.organizationMember.create({
      data: {
        userId: session.user.id,
        organizationId: org.id,
        role: "owner",
      },
      include: { organization: true },
    })
  }

  return { id: membership.organization.id, name: membership.organization.name, slug: membership.organization.slug }
}
