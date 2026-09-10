import { prisma } from "@/lib/prisma"
import type { Project as ProjectRecord } from "@/app/generated/prisma/client"

export function getOwnedProjects(userId: string): Promise<ProjectRecord[]> {
  return prisma.project.findMany({
    where: { ownerId: userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function getSharedProjects(
  email: string | null
): Promise<ProjectRecord[]> {
  if (!email) return []

  const collaborations = await prisma.projectCollaborator.findMany({
    where: { collaboratorEmail: email },
    include: { project: true },
    orderBy: { createdAt: "desc" },
  })

  return collaborations.map((collaboration) => collaboration.project)
}
