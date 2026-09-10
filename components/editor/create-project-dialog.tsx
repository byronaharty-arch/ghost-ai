"use client"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function CreateProjectDialog() {
  const {
    dialog,
    name,
    nameError,
    submitError,
    roomId,
    isLoading,
    setName,
    closeDialog,
    submitCreate,
  } = useProjectDialogsContext()

  const isOpen = dialog?.type === "create"

  return (
    <EditorDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
      title="Create project"
      description="Give your architecture workspace a name."
      footer={
        <>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" form="create-project-form" disabled={isLoading}>
            {isLoading ? "Creating..." : "Create"}
          </Button>
        </>
      }
    >
      <form
        id="create-project-form"
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submitCreate()
        }}
      >
        <label htmlFor="create-project-name" className="text-sm text-copy-secondary">
          Project name
        </label>
        <Input
          id="create-project-name"
          autoFocus
          required
          aria-describedby={nameError ? "create-project-name-error" : undefined}
          aria-invalid={Boolean(nameError)}
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="My architecture project"
        />
        {nameError ? (
          <p id="create-project-name-error" role="alert" className="text-sm text-destructive">
            {nameError}
          </p>
        ) : null}
        <p className="text-sm text-copy-muted">
          {roomId || "your-project-room-id"}
        </p>
        {submitError ? (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </form>
    </EditorDialog>
  )
}
