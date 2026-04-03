import { redirect } from "next/navigation"
import { createSupabaseServerClient } from "@/lib/supabase/server"
import { prisma } from "@/lib/prisma"
import type { UserRole } from "@/types"

export interface SessionUser {
  id: string
  email: string
  role: UserRole
  fullName: string
}

export async function getSession(): Promise<SessionUser | null> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, role: true, fullName: true },
  })

  return dbUser
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession()
  if (!session) redirect("/login")
  return session
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth()
  if (session.role !== "admin") redirect("/dashboard")
  return session
}
