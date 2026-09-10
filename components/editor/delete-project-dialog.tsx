"use client"

import { EditorDialog } from "@/components/editor/editor-dialog"
import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"
import { Button } from "@/components/ui/button"

export function DeleteProjectDialog() {
  const { dialog, submitError, isLoading, closeDialog, submitDelete } =
    useProjectDialogsContext()

  const isOpen = dialog?.type === "delete"
  const projectName = dialog?.type === "delete" ? dialog.project.name : ""

  return (
    <EditorDialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) closeDialog()
      }}
      title="Delete project"
      description={`This will permanently delete "${projectName}". This action cannot be undone.`}
      footer={
        <>
          <Button type="button" variant="outline" onClick={closeDialog}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={isLoading}
            onClick={submitDelete}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </>
      }
    >
      {submitError ? (
        <p role="alert" className="text-sm text-destructive">
          {submitError}
        </p>
      ) : null}
    </EditorDialog>
  )
}
