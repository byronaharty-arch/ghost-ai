"use client"

import { Pencil, Plus, Trash2, X } from "lucide-react"

import { useProjectDialogsContext } from "@/components/editor/project-dialogs-context"
import { Button } from "@/components/ui/button"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import type { Project } from "@/types/project"

interface ProjectSidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function ProjectSidebar({ isOpen, onClose }: ProjectSidebarProps) {
  const { projects, openCreateDialog, openRenameDialog, openDeleteDialog } =
    useProjectDialogsContext()

  const ownedProjects = projects.filter((project) => project.role === "owner")
  const sharedProjects = projects.filter(
    (project) => project.role === "collaborator"
  )

  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cn(
          "fixed inset-0 z-30 bg-bg-base/60 transition-opacity duration-200 lg:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      <aside
        aria-hidden={!isOpen}
        inert={!isOpen}
        className={cn(
          "fixed inset-y-0 top-14 z-40 flex h-[calc(100%-3.5rem)] w-72 flex-col border-r border-surface-border bg-bg-surface transition-[left] duration-200 ease-in-out",
          isOpen ? "left-0" : "-left-72"
        )}
      >
        <div className="flex items-center justify-between border-b border-surface-border px-4 py-3">
          <h2 className="text-sm font-medium text-copy-primary">Projects</h2>
          <Button variant="ghost" size="icon-sm" onClick={onClose}>
            <X />
            <span className="sr-only">Close</span>
          </Button>
        </div>

        <Tabs
          defaultValue="my-projects"
          className="flex flex-1 flex-col overflow-hidden px-4 pt-3"
        >
          <TabsList className="w-full">
            <TabsTrigger value="my-projects" className="flex-1">
              My Projects
            </TabsTrigger>
            <TabsTrigger value="shared" className="flex-1">
              Shared
            </TabsTrigger>
          </TabsList>

          <TabsContent value="my-projects" className="flex-1 overflow-hidden">
            <ProjectList
              projects={ownedProjects}
              emptyLabel="No projects yet."
              showActions
              onRename={openRenameDialog}
              onDelete={openDeleteDialog}
            />
          </TabsContent>

          <TabsContent value="shared" className="flex-1 overflow-hidden">
            <ProjectList projects={sharedProjects} emptyLabel="Nothing shared yet." />
          </TabsContent>
        </Tabs>

        <div className="border-t border-surface-border p-4">
          <Button className="w-full" onClick={openCreateDialog}>
            <Plus />
            New Project
          </Button>
        </div>
      </aside>
    </>
  )
}

interface ProjectListProps {
  projects: Project[]
  emptyLabel: string
  showActions?: boolean
  onRename?: (project: Project) => void
  onDelete?: (project: Project) => void
}

function ProjectList({
  projects,
  emptyLabel,
  showActions,
  onRename,
  onDelete,
}: ProjectListProps) {
  if (projects.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-copy-muted">{emptyLabel}</p>
      </div>
    )
  }

  return (
    <ul className="flex h-full flex-col gap-1 overflow-y-auto py-2">
      {projects.map((project) => (
        <li
          key={project.id}
          className="group flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-bg-elevated"
        >
          <span className="truncate text-sm text-copy-primary">
            {project.name}
          </span>

          {showActions ? (
            <div className="flex shrink-0 items-center gap-1 opacity-100 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:focus-within:opacity-100 [@media(hover:hover)]:group-hover:opacity-100">
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onRename?.(project)}
              >
                <Pencil />
                <span className="sr-only">Rename {project.name}</span>
              </Button>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => onDelete?.(project)}
              >
                <Trash2 />
                <span className="sr-only">Delete {project.name}</span>
              </Button>
            </div>
          ) : null}
        </li>
      ))}
    </ul>
  )
}
