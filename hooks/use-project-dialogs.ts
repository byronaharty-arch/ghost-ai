"use client"

import { useMemo, useState, useTransition } from "react"
import { usePathname, useRouter } from "next/navigation"

import { generateRoomSuffix, isValidSlug, slugify } from "@/lib/utils"
import type { Project } from "@/types/project"

type DialogState =
  | { type: "create" }
  | { type: "rename"; project: Project }
  | { type: "delete"; project: Project }
  | null

interface UseProjectDialogsOptions {
  ownedProjects: Project[]
  sharedProjects: Project[]
}

async function readErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  const body = await response.json().catch(() => null)
  return typeof body?.error === "string" ? body.error : fallback
}

export function useProjectDialogs({
  ownedProjects,
  sharedProjects,
}: UseProjectDialogsOptions) {
  const router = useRouter()
  const pathname = usePathname()

  const [dialog, setDialog] = useState<DialogState>(null)
  const [name, setNameState] = useState("")
  const [nameError, setNameError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [roomSuffix, setRoomSuffix] = useState("")
  const [isMutating, setIsMutating] = useState(false)
  const [isRefreshing, startTransition] = useTransition()

  const projects = useMemo(
    () => [...ownedProjects, ...sharedProjects],
    [ownedProjects, sharedProjects]
  )

  const slug = slugify(name)
  const roomId = slug ? `${slug}-${roomSuffix}` : ""
  const isLoading = isMutating || isRefreshing

  function setName(value: string) {
    setNameState(value)
    setNameError(null)
  }

  function openCreateDialog() {
    setNameState("")
    setNameError(null)
    setSubmitError(null)
    setRoomSuffix(generateRoomSuffix())
    setDialog({ type: "create" })
  }

  function openRenameDialog(project: Project) {
    setNameState(project.name)
    setNameError(null)
    setSubmitError(null)
    setDialog({ type: "rename", project })
  }

  function openDeleteDialog(project: Project) {
    setSubmitError(null)
    setDialog({ type: "delete", project })
  }

  function closeDialog() {
    setDialog(null)
    setNameState("")
    setNameError(null)
    setSubmitError(null)
    setIsMutating(false)
  }

  async function submitCreate() {
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

    const id = `${projectSlug}-${roomSuffix}`

    setIsMutating(true)
    setSubmitError(null)
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: trimmedName }),
      })

      if (!response.ok) {
        setSubmitError(await readErrorMessage(response, "Failed to create project."))
        setIsMutating(false)
        return
      }

      const { project } = (await response.json()) as { project: { id: string } }
      setIsMutating(false)
      closeDialog()
      router.push(`/editor/${project.id}`)
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setSubmitError("Failed to create project.")
      setIsMutating(false)
    }
  }

  async function submitRename() {
    if (dialog?.type !== "rename") return
    const trimmedName = name.trim()
    if (!trimmedName) {
      setNameError("Project name is required.")
      return
    }

    const { project } = dialog
    setIsMutating(true)
    setSubmitError(null)
    try {
      const response = await fetch("/api/projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id, name: trimmedName }),
      })

      if (!response.ok) {
        setSubmitError(await readErrorMessage(response, "Failed to rename project."))
        setIsMutating(false)
        return
      }

      setIsMutating(false)
      closeDialog()
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setSubmitError("Failed to rename project.")
      setIsMutating(false)
    }
  }

  async function submitDelete() {
    if (dialog?.type !== "delete") return

    const { project } = dialog
    const isActiveWorkspace = pathname === `/editor/${project.id}`

    setIsMutating(true)
    setSubmitError(null)
    try {
      const response = await fetch("/api/projects", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      })

      if (!response.ok) {
        setSubmitError(await readErrorMessage(response, "Failed to delete project."))
        setIsMutating(false)
        return
      }

      setIsMutating(false)
      closeDialog()
      if (isActiveWorkspace) {
        router.push("/editor")
      }
      startTransition(() => {
        router.refresh()
      })
    } catch {
      setSubmitError("Failed to delete project.")
      setIsMutating(false)
    }
  }

  return {
    projects,
    dialog,
    name,
    nameError,
    submitError,
    slug,
    roomId,
    isLoading,
    setName,
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
