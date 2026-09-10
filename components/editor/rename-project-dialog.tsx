"use client"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function RenameProjectDialog() {
  const {
    dialog,
    name,
    nameError,
    submitError,
    isLoading,
    setName,
    closeDialog,
    submitRename,
  } = useProjectDialogsContext()

  const isOpen = dialog?.type === "rename"
  const currentName = dialog?.type === "rename" ? dialog.project.name : ""

  return (
    <EditorDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
      title="Rename project"
      description={`Choose a new name for "${currentName}".`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button type="submit" form="rename-project-form" disabled={isLoading}>
            {isLoading ? "Saving..." : "Save"}
          </Button>
        </>
      }
    >
      <form
        id="rename-project-form"
        className="flex flex-col gap-2"
        onSubmit={(event) => {
          event.preventDefault()
          submitRename()
        }}
      >
        <label htmlFor="rename-project-name" className="text-sm text-copy-secondary">
          Project name
        </label>
        <Input
          id="rename-project-name"
          autoFocus
          required
          aria-describedby={nameError ? "rename-project-name-error" : undefined}
          aria-invalid={Boolean(nameError)}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        {nameError ? (
          <p id="rename-project-name-error" role="alert" className="text-sm text-destructive">
            {nameError}
          </p>
        ) : null}
        {submitError ? (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        ) : null}
      </form>
    </EditorDialog>
  )
}
