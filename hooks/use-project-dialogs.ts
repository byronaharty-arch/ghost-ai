"use client"

import { useRef, useState } from "react"

import { MOCK_PROJECTS } from "@/lib/mock-projects"
import { isValidSlug, slugify } from "@/lib/utils"
import type { Project } from "@/types/project"

type DialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null

const MOCK_SUBMIT_DELAY_MS = 400

export function useProjectDialogs() {
  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS)
  const [dialog, setDialog] = useState<DialogState>(null)
  const [name, setName] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const pendingMutationRef = useRef<number | null>(null)
  const mutationVersionRef = useRef(0)

  const slug = slugify(name)

  function openCreateDialog() {
    setName("")
    setNameError(null)
    setDialog({ type: "create" })
  }

  function openRenameDialog(project: Project) {
    setName(project.name)
    setNameError(null)
    setDialog({ type: "rename", project })
  }

  function openDeleteDialog(project: Project) {
    setDialog({ type: "delete", project })
  }

  function cancelPendingMutation() {
    if (pendingMutationRef.current !== null) {
      window.clearTimeout(pendingMutationRef.current)
      pendingMutationRef.current = null
    }
    mutationVersionRef.current += 1
  }

  function closeDialog() {
    cancelPendingMutation()
    setDialog(null)
    setName("")
    setNameError(null)
    setIsLoading(false)
  }

  function submitCreate() {
    const trimmedName = name.trim()
    const projectSlug = slugify(trimmedName)
    if (!trimmedName) {
      setNameError("Project name is required.")
      return
    }
    if (!isValidSlug(projectSlug)) {
      setNameError("Project name must produce a valid slug.")
      return
    }

    setIsLoading(true)
    cancelPendingMutation()
    const mutationVersion = mutationVersionRef.current
    pendingMutationRef.current = window.setTimeout(() => {
      if (mutationVersion !== mutationVersionRef.current) return

      pendingMutationRef.current = null
      setProjects((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          name: trimmedName,
          slug: projectSlug,
          role: "owner",
        },
      ])
      setIsLoading(false)
      closeDialog()
    }, MOCK_SUBMIT_DELAY_MS)
  }

  function submitRename() {
    if (dialog?.type !== "rename") return
    const trimmedName = name.trim()
    const projectSlug = slugify(trimmedName)
    if (!trimmedName) {
      setNameError("Project name is required.")
      return
    }
    if (!isValidSlug(projectSlug)) {
      setNameError("Project name must produce a valid slug.")
      return
    }

    const { project } = dialog
    setIsLoading(true)
    cancelPendingMutation()
    const mutationVersion = mutationVersionRef.current
    pendingMutationRef.current = window.setTimeout(() => {
      if (mutationVersion !== mutationVersionRef.current) return

      pendingMutationRef.current = null
      setProjects((current) =>
        current.map((item) =>
          item.id === project.id
            ? { ...item, name: trimmedName, slug: projectSlug }
            : item
        )
      )
      setIsLoading(false)
      closeDialog()
    }, MOCK_SUBMIT_DELAY_MS)
  }

  function submitDelete() {
    if (dialog?.type !== "delete") return

    const { project } = dialog
    setIsLoading(true)
    cancelPendingMutation()
    const mutationVersion = mutationVersionRef.current
    pendingMutationRef.current = window.setTimeout(() => {
      if (mutationVersion !== mutationVersionRef.current) return

      pendingMutationRef.current = null
      setProjects((current) => current.filter((item) => item.id !== project.id))
      setIsLoading(false)
      closeDialog()
    }, MOCK_SUBMIT_DELAY_MS)
  }

  return {
    projects,
    dialog,
    name,
    nameError,
    slug,
    isLoading,
    setName: (value: string) => {
      setName(value)
      setNameError(null)
    },
    openCreateDialog,
    openRenameDialog,
    openDeleteDialog,
    closeDialog,
    submitCreate,
    submitRename,
    submitDelete,
  }
}

export type UseProjectDialogsReturn = ReturnType<typeof useProjectDialogs>
