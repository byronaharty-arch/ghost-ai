import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import type { ReactNode } from "react"

import { EditorShell } from "@/components/editor/editor-shell"
import { getOwnedProjects, getSharedProjects } from "@/lib/projects"
import type { Project } from "@/types/project"

export default async function EditorLayout({
  children,
}: {
  children: ReactNode
}) {
  const { userId } = await auth()
  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  const email = user?.primaryEmailAddress?.emailAddress ?? null

  const [ownedRecords, sharedRecords] = await Promise.all([
    getOwnedProjects(userId),
    getSharedProjects(email),
  ])

  const ownedProjects: Project[] = ownedRecords.map((project) => ({
    id: project.id,
    name: project.name,
    role: "owner",
  }))
  const sharedProjects: Project[] = sharedRecords.map((project) => ({
    id: project.id,
    name: project.name,
    role: "collaborator",
  }))

  return (
    <EditorShell ownedProjects={ownedProjects} sharedProjects={sharedProjects}>
      {children}
    </EditorShell>
  )
}
