import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import GitHub from "next-auth/providers/github"
import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as any,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({ clientId: process.env.AUTH_GOOGLE_ID || "", clientSecret: process.env.AUTH_GOOGLE_SECRET || "", allowDangerousEmailAccountLinking: true }),
    GitHub({ clientId: process.env.AUTH_GITHUB_ID || "", clientSecret: process.env.AUTH_GITHUB_SECRET || "", allowDangerousEmailAccountLinking: true }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
          select: { id: true, email: true, name: true, image: true, passwordHash: true },
        })

        if (!user || !user.passwordHash) return null

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        )

        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      if (user?.id) {
        const count = await prisma.organizationMember.count({ where: { userId: user.id } })
        if (count === 0) {
          const org = await prisma.organization.create({
            data: {
              name: "My Company",
              slug: `company-${user.id.slice(0, 6)}`,
              settings: { create: {} },
            },
          })
          await prisma.organizationMember.create({
            data: { userId: user.id, organizationId: org.id, role: "owner" },
          })
        }
      }
      return true
    },
    async jwt({ token, user, trigger, session: updateSession }) {
      if (user) {
        token.id = user.id
        const member = await prisma.organizationMember.findFirst({
          where: { userId: user.id },
        })
        if (member) token.activeOrganizationId = member.organizationId
      }
      if (trigger === "update" && updateSession && typeof updateSession === "object" && "activeOrganizationId" in updateSession) {
        const orgId = String((updateSession as any).activeOrganizationId)
        if (orgId) {
          const member = await prisma.organizationMember.findFirst({
            where: { userId: token.id as string, organizationId: orgId },
          })
          if (member) token.activeOrganizationId = orgId
        }
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.id as string
        ;(session.user as any).activeOrganizationId = token.activeOrganizationId
      }
      return session
    },
  },
})
