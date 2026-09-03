# Architecture Context

## Stack

| Layer     | Technology           | Role   |
| --------- | -------------------- | ------ |
| Framework | Next.js + TypeScript | Full-stack app with server/client boundaries |
| UI        | Tailwind + shadcn/ui | Component composition and styling |
| Auth      | Clerk                | User identity and route protection |
| Database  | Prisma + PostgreSQL  | Relational metadata: projects, collaborators, spec and task runs |
| Canvas   | Liveblocks + React Flow | Real-time collaborative canvas, presence and cursors |
|Background tasks | Trigger.dev | Durable AI generation workflows |
|Artifact storage | Vercel Blob | Canvas snapshots and generated Markdown specs |

## System Boundaries

- `app/api` - Authenticated request handlers: input validation, ownership checks, task triggering and persistence.
- `trigger` - Long-running background jobs: AI design generation and spec generation.
- `lib` - Shared infrastucture: Prisma client, access control helpers and utilities.
- `components` - UI composition: canvas surfaces, sidebars, dialogs and interactive elements.
- `prisma` - Database schema and generated client output.
- `data` - Legacy local directory. Not used for new artifacts.

## Storage Model

- **Database**: metadata, ownership, relationships and task runs records.
- **Vercel Blob**: generate artifacts - canvas snapshots at `canvas/{projectId}.json` and spec at `spec/{projectId}/{specId}.md`.
- Project records, spec records and task run records belong in PostgreSQL.
- Canvas content and Markdown output are stored in and retrieved from Vercel Blob.
- The blob URL is stored in the database (`canvasJsonPath`, `filePath`) as the reference to the artifact.

## Auth and Collaboration Model

- Every project has a single owner (Clerk user ID).
- Projects can include additinal collaborators.
- Only authenticated users can access projeced routes.
- Only the owner or collaborator can mutate project resources.
- Liveblocks room tokens are issued only after verifying project membership.

## Starter System Designs

- Prebuilt templates are static canvas snapshots stored in the codebase.
- Templates are loaded into the active Liveblocks room when a user imports one.
- Import can occure on canvas creation or from within the editor at any time.
- Template data follows the same node/edge schema as user-created canvas projects in the database.

## Invariants

1. Request handlers do not run long-lived AI work - that belongs in the background tasks.
2. Metadata and larg generated artifacts are stored in seperate layers.
3. Auth and ownership are enforced at every mutation boundary.
4. Client components are used only where browser interactivity or real-time state requires them.
5. The canvas schema must remain consistent between user-created content and imported templates.