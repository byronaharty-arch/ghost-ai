"use client"

import { createContext, useContext, type ReactNode } from "react"

import {
  useProjectDialogs,
  type UseProjectDialogsReturn,
} from "@/hooks/use-project-dialogs"

const ProjectDialogsContext = createContext<UseProjectDialogsReturn | null>(
  null
)

export function ProjectDialogsProvider({ children }: { children: ReactNode }) {
  const value = useProjectDialogs()
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
