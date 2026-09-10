"use client"

import { createContext, useContext, type ReactNode } from "react"

import {
  useProjectDialogs,
  type UseProjectDialogsReturn,
} from "@/hooks/use-project-dialogs"
import type { Project } from "@/types/project"

const ProjectDialogsContext = createContext<UseProjectDialogsReturn | null>(
  null
)

interface ProjectDialogsProviderProps {
  children: ReactNode
  ownedProjects: Project[]
  sharedProjects: Project[]
}

export function ProjectDialogsProvider({
  children,
  ownedProjects,
  sharedProjects,
}: ProjectDialogsProviderProps) {
  const value = useProjectDialogs({ ownedProjects, sharedProjects })
  return (
    <ProjectDialogsContext.Provider value={value}>
      {children}
    </ProjectDialogsContext.Provider>
  )
}

export function useProjectDialogsContext() {
  const context = useContext(ProjectDialogsContext)
  if (!context) {
    throw new Error(
      "useProjectDialogsContext must be used within a ProjectDialogsProvider"
    )
  }
  return context
}
