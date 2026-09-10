import { auth, currentUser } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"

import { prisma } from "@/lib/prisma"

export default async function ProjectWorkspacePage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
  })
  if (!project) {
    notFound()
  }

  if (project.ownerId !== userId) {
    const user = await currentUser()
    const email = user?.primaryEmailAddress?.emailAddress ?? null
    const collaborator = email
      ? await prisma.projectCollaborator.findUnique({
          where: {
            projectId_collaboratorEmail: {
              projectId: project.id,
              collaboratorEmail: email,
            },
          },
        })
      : null

    if (!collaborator) {
      notFound()
    }
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
      <h1 className="text-lg font-medium text-copy-primary">{project.name}</h1>
      <p className="text-sm text-copy-muted">Canvas coming soon.</p>
    </div>
  )
}
