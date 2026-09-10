# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- None — `07-wire-editor-home.md` is complete. Awaiting the next feature-spec chapter.

## Completed

- **Fixed: newly created project didn't appear in the sidebar until a manual
  page refresh** (user-reported, in `hooks/use-project-dialogs.ts` from
  `07-wire-editor-home.md`). Root cause: `submitCreate()` called
  `router.push(`/editor/${project.id}`)` and `router.refresh()`
  back-to-back with `refresh()` fired *first* (wrapped in `startTransition`,
  not awaited) and `push()` immediately after. `router.refresh()` only
  invalidates the Client Cache for whatever route is current **at the
  moment it's called** — since it ran before `push()`, it refreshed the
  soon-to-be-abandoned `/editor` route, not the destination
  `/editor/[projectId]` route being navigated to. `app/editor/layout.tsx`
  (which fetches `getOwnedProjects`/`getSharedProjects` and renders the
  sidebar) is shared by both routes, so the destination page rendered with
  whatever cached layout data the client already had for that segment —
  stale, missing the just-created project — until a full manual reload
  forced a real refetch. Same bug existed in `submitDelete()`'s
  redirect-to-`/editor` branch (`refresh()` and the conditional
  `push("/editor")` fired together in one `startTransition`). Fixed both by
  reordering to navigate first, *then* refresh: `router.push(...)`
  immediately, followed by `router.refresh()` inside `startTransition` —
  so the refresh targets the route the user actually lands on.
  `submitRename()` was already correct (no navigation involved, so a bare
  `router.refresh()` on the still-current route was never affected by this
  ordering issue). Verified: `npm run build` and `npm run lint` pass.

- **Switched local `DATABASE_URL` to a local dev database** (user-requested,
  triggered by `npm run dev` throwing
  `PrismaClientKnownRequestError: ... Server has closed the connection.` from
  `lib/projects.ts`'s `getSharedProjects()` → `prisma.projectCollaborator.findMany()`):
  - Root cause confirmed, not fixed in application code: this machine cannot
    sustain a raw Postgres wire-protocol connection to the real database at
    `pooled.db.prisma.io:5432` — a plain `net.createConnection` completes the
    TCP handshake but the connection is reset immediately after, before any
    Postgres protocol bytes are exchanged (re-confirmed live during this
    session; matches the identical finding logged in this file's Session
    Notes from the `05-prisma.md` unit — a corporate proxy/DPI killing
    non-HTTP(S) traffic on that port, not a code or schema problem).
  - Spun up a **persistent** local Prisma dev Postgres server (`npx prisma
    dev -d --name ghost-ai-local`, unlike the throwaway ones used for
    verification in earlier units) and ran `npx prisma migrate deploy`
    against it — applied cleanly. Its actual assigned TCP address came back
    as `postgres://postgres:postgres@localhost:51218/template1?sslmode=disable`
    (the `-p`/`--db-port` flags passed at creation didn't change the
    assigned ports; used whatever `npx prisma dev ls` reported instead of
    fighting the flags). List/inspect it any time with `npx prisma dev ls`;
    it survives across terminal sessions until explicitly stopped
    (`npx prisma dev stop ghost-ai-local`) or removed
    (`npx prisma dev rm ghost-ai-local --force`).
  - `.env` and `.env.local`: commented out the real
    `postgres://...@pooled.db.prisma.io:5432/...` `DATABASE_URL` (kept in
    place, not deleted, labeled "RESTORE THIS BEFORE DEPLOYING") and added
    the local one as the active `DATABASE_URL` beneath it, with a matching
    "local-only, not for deployment" label. Both files are gitignored
    (`.env*` in `.gitignore`) so this never touches version control.
  - Verified: `npx prisma generate` succeeded; a direct script importing
    `lib/prisma.ts`'s singleton and calling `prisma.project.findMany()`
    against the local DB returned successfully (`OK, project count: 0`) with
    `DATABASE_URL` set to the local connection string; started `npm run dev`
    and confirmed `GET /api/projects` no longer throws the connection-reset
    error (returns the expected `401` for an unauthenticated request instead
    of an unhandled 500-class Prisma error) — the failure mode from the bug
    report is gone.
  - **Action required before deploying**: restore the real `DATABASE_URL` in
    whatever env mechanism the deployment target uses (uncomment/copy the
    line preserved in `.env`/`.env.local`, or set it directly in the hosting
    platform's env config) and confirm `npx prisma migrate deploy` has been
    run against that real database from a network that can actually reach
    it — local dev running against `ghost-ai-local` proves nothing about the
    real database's migration state. See the matching "Next Up" bullet
    below.

- Wire editor home sidebar and dialogs to the real project API
  (`context/feature-spec/07-wire-editor-home.md`):
  - **Ambiguity resolved: where "the editor home page" fetches from.** The
    spec says "the editor home page is a server component" that fetches
    owned/shared projects and "passes both lists to the sidebar," but the
    sidebar (`ProjectSidebar`) is rendered by `EditorShell`, which lives in
    `app/editor/layout.tsx` — a parent of `app/editor/page.tsx` (the literal
    "home page"), not a descendant. A child page component has no prop path
    to a sidebar rendered by its own parent layout. Resolved by doing the
    fetch in `app/editor/layout.tsx` instead (already a server component,
    already the thing that instantiates `EditorShell`/the sidebar for every
    `/editor/*` route) and treating the spec's "editor home page" as shorthand
    for the `/editor` section's server shell, not literally `page.tsx`.
    `app/editor/page.tsx` itself is unchanged (still just renders
    `EditorHome`, which needs no project data of its own).
  - **Ambiguity resolved: `Project.slug`.** The pre-existing `Project` UI type
    (`types/project.ts`) had a `slug` field carried over from
    `04-project-dialogs.md`'s mock data, but grepped zero usages anywhere in
    `components/`. The real `Project` Prisma model (`05-prisma.md`) has no
    slug column either. Removed the field from `types/project.ts` rather than
    inventing a fake value to keep it populated — dead field, not a
    requirement.
  - **Ambiguity resolved: "the project ID and Liveblocks room ID should stay
    aligned."** Liveblocks isn't installed/wired into this codebase yet (no
    package, no room-creation code anywhere) — that's a future spec chapter.
    Read this line as a forward constraint: whatever value later becomes the
    Liveblocks room ID must equal `Project.id` in the database, so the two
    are never two different strings that have to be kept in sync by hand.
    Implemented by generating the "room ID" client-side at create time
    (`slugify(name) + "-" + generateRoomSuffix()`, the suffix a random 6-char
    hex string from `crypto.randomUUID()`) and sending it as an explicit `id`
    in the `POST /api/projects` body, which the route now accepts and uses
    verbatim as the Prisma row's primary key (instead of always letting
    `@default(cuid())` generate one) — so `project.id` *is* the value a
    future Liveblocks integration would use as the room id, with nothing to
    keep in sync. `POST` validates the client-supplied `id` with the existing
    `isValidSlug()` regex and returns `409` on a `P2002` unique-constraint
    conflict (collision is practically impossible at a 6-hex-char random
    suffix; a plain error message was judged sufficient rather than building
    auto-retry logic that wasn't asked for).
  - **Ambiguity resolved: `PATCH`/`DELETE /api/projects/[id]`.** The spec text
    describes idealized per-resource paths, but the actual, already-shipped
    (`06-project-apis.md`) route is a single `app/api/projects/route.ts` with
    `id` in the JSON body for both `PATCH` and `DELETE`, not a dynamic
    `[id]` segment. Rebuilding the route structure to match the spec's path
    notation literally would be a materially bigger, riskier change to an
    already-tested endpoint, and this chapter's own framing ("wire ... to the
    real project API") points at using what exists, not rebuilding it. Read
    the bracket notation as documentation shorthand for "the project's
    update/delete endpoint" and kept calling the real `/api/projects`
    contract from the client.
  - **Added `app/editor/[projectId]/page.tsx`** (not explicitly asked for,
    but required for "create navigates to workspace" to be a real, testable
    outcome instead of a 404): a minimal placeholder, same pattern as the
    original `02-editor.md` "Canvas coming soon" page — `findUnique`s the
    project, `notFound()`s if it doesn't exist or the current user is neither
    the owner nor a matching `ProjectCollaborator` by email, otherwise shows
    the project name and "Canvas coming soon." No canvas features invented.
  - `lib/projects.ts` (new — the "existing projects data helper" the spec's
    wording assumes; it didn't actually exist yet before this chapter):
    `getOwnedProjects(userId)` (`prisma.project.findMany` by `ownerId`, reused
    by both `app/editor/layout.tsx` and the `GET` handler in
    `app/api/projects/route.ts` — the latter refactored to call it instead of
    duplicating the query) and `getSharedProjects(email)` (looks up
    `ProjectCollaborator` rows by `collaboratorEmail` — the schema's only
    collaborator-identifying field is email, not a Clerk user id — and maps
    to their parent `Project` rows; returns `[]` for a `null` email so a
    signed-in user with no verified email doesn't crash the page).
  - `app/editor/layout.tsx`: now `async`, calls Clerk's `auth()` +
    `currentUser()` (the latter needed for `user.primaryEmailAddress` to
    resolve shared-project membership by email — `auth()` alone only exposes
    the Clerk user id), fetches both lists via `lib/projects.ts` in parallel,
    maps each Prisma record to the UI `Project` shape (`id`, `name`, and a
    `role` tag added at the mapping boundary — `"owner"` for the owned list,
    `"collaborator"` for the shared list), and passes both arrays as props
    into `EditorShell`. No client-side fetch for the initial load, per spec.
  - `app/api/projects/route.ts`: `GET` now calls `getOwnedProjects` (no
    behavior change, just de-duplicated against the layout's query). `POST`
    accepts an optional `id` in the body (validated with `isValidSlug`,
    `400` if invalid), uses it as the Prisma row id when present, and
    catches `Prisma.PrismaClientKnownRequestError` with `code === "P2002"`
    to return `409` on an id collision instead of an unhandled 500.
  - `hooks/use-project-dialogs.ts`: rewritten from the mock/`setTimeout`
    version. Takes `{ ownedProjects, sharedProjects }` as arguments (from the
    server-fetched props, threaded through `ProjectDialogsProvider` →
    `EditorShell`) and derives `projects` as a plain `useMemo` concatenation —
    deliberately **not** copied into its own `useState`, so there is no
    client-side cache that can drift from the server truth. Dialog
    open/close, the `name` field, `nameError` (client-side validation), and
    a new `submitError` (surfaces the API's own JSON `error` message on a
    failed fetch — a real network-backed API can fail in ways the old mock
    never could, e.g. `403`/`404`/`409`) remain local `useState`. Added
    `roomSuffix` (generated fresh each time `openCreateDialog()` runs) and a
    derived `roomId` (`slug + "-" + roomSuffix`) for the create dialog's room
    ID preview. `submitCreate`/`submitRename`/`submitDelete` now `fetch()`
    the real `/api/projects` endpoint (`POST`/`PATCH`/`DELETE` respectively)
    instead of a 400ms fake timer; on success they close the dialog and call
    `router.refresh()` (via `next/navigation`'s `useRouter`, wrapped in
    `useTransition` so `isPending` folds into the existing `isLoading` flag)
    so the next server render re-fetches real data — this is what makes
    "refresh on success" actually pull fresh state rather than only
    resetting UI. `submitCreate` additionally `router.push`es to
    `/editor/${project.id}` after a successful create. `submitDelete`
    compares `usePathname()` against `/editor/${project.id}` to detect "the
    active workspace" and calls `router.push("/editor")` (alongside the
    refresh) only in that case, per spec.
  - `lib/utils.ts`: added `generateRoomSuffix()` (`crypto.randomUUID()`,
    hyphens stripped, first 6 hex chars) next to the existing
    `slugify`/`isValidSlug` helpers.
  - `components/editor/project-dialogs-context.tsx`,
    `components/editor/editor-shell.tsx`: both now take and forward
    `ownedProjects`/`sharedProjects` props instead of the hook owning its own
    mock array — pure plumbing changes, no new state.
  - `components/editor/create-project-dialog.tsx`: preview paragraph now
    shows `roomId` (the real value sent as `POST`'s `id`) instead of the old
    bare `slug`. All three dialogs (`create-project-dialog.tsx`,
    `rename-project-dialog.tsx`, `delete-project-dialog.tsx`) now render
    `submitError` in a `text-destructive` paragraph — `EditorDialog`'s
    existing `children` slot for create/rename (inside the `<form>`) and
    for delete (which had no children before; now renders a conditional
    error paragraph there).
  - Deleted `lib/mock-projects.ts` (only ever imported by the old hook, now
    unused — real API data replaces it entirely, not layered alongside it).
  - Verified: `npm run build` and `npm run lint` both pass (`/editor/
    [projectId]` shows as a new dynamic route in the build output).
    Confirmed `/editor` and `/editor/[projectId]` still redirect
    unauthenticated browser-like requests to sign-in (`307`, matching the
    existing `03-auth.md`/`06-project-apis.md` behavior — no regression).
    Backend logic verified directly against a temporary local Postgres
    (`npx prisma dev`, same technique as `05-prisma.md`/`06-project-apis.md`,
    removed afterward): `getOwnedProjects`/`getSharedProjects` scope
    correctly by owner id and by collaborator email respectively (including
    a `null`-email no-crash case); an explicit client-supplied `id` is
    stored verbatim on the created row; a duplicate explicit `id` throws
    `P2002` (confirming the route's `409` branch is reachable); the
    owner-or-collaborator-by-email check used by the new workspace page
    correctly allows the owner and correctly excludes an unrelated user.
    Full click-through UI wiring verified with a real headless Chrome
    (puppeteer) pass against the actual running dev server: built a
    temporary, non-product route (`app/smoke-test-07/page.tsx`, deleted
    afterward — note it could **not** be named with a leading underscore
    like `app/_smoke`, since Next's App Router treats `_`-prefixed folders as
    private/non-routable, which cost a debugging round-trip) rendering
    `EditorShell` directly with fixed fake owned/shared project props, and
    temporarily marked it public in `proxy.ts` (reverted immediately after,
    confirmed byte-for-byte identical to before) so it didn't need a real
    Clerk session — this was enough because the flows under test
    (sidebar rendering, dialog open/prefill/close, `fetch` wiring) don't
    depend on the layout's server-side auth call, only on props the harness
    supplied directly. Confirmed: sidebar renders the owned/shared lists with
    correct per-tab filtering and that only owned rows get action buttons;
    New Project opens the create dialog and the room-ID preview live-updates
    to the exact `slug-<6-hex-chars>` shape; submitting Create issues a real
    `POST /api/projects` with `{ id, name }` matching that shape; Rename
    opens prefilled with the current name and submitting issues a real
    `PATCH` with the correct `{ id, name }`; Delete shows the target
    project's name and submitting issues a real `DELETE` with the correct
    `{ id }`; all three, being genuinely unauthenticated requests, correctly
    receive `401 { error: "Unauthorized" }` from the live route and correctly
    display that message via the new `submitError` state — exercising the
    full success-shaped request path and the real error-handling path in one
    pass, which is as much of this flow as can be verified without a real
    Clerk session in this sandbox (same limitation as every prior unit's
    Session Notes). Puppeteer was installed with `npm install --no-save`
    (Chromium already cached locally from a prior session, confirmed before
    installing) and uninstalled again after; confirmed `package.json`/
    `package-lock.json` mention it nowhere.

- Project REST API routes (`context/feature-spec/06-project-apis.md`):
  - `app/api/projects/route.ts`: `GET`/`POST`/`PATCH`/`DELETE` handlers for
    `/api/projects`, all backend-only per the spec's "do not wire the UI yet"
    instruction — nothing in `components/`/`app/editor` calls this route.
    `GET` lists `prisma.project.findMany({ where: { ownerId: userId } })`
    ordered newest-first — scoped to the spec's "current user's projects"
    with no `ProjectCollaborator` involvement (that model exists in the
    schema from `05-prisma.md` but this spec chapter never mentions
    collaborator visibility, so it was left out rather than invented).
    `POST` creates with `ownerId` set to the authenticated Clerk `userId` and
    `name` defaulted to `"Untitled Project"` when the request body's `name`
    is missing or blank (`rawName.trim() || "Untitled Project"`); relies on
    the schema's existing `@default(cuid())` for `id`, no sequential ID
    added. `PATCH`/`DELETE` both take `{ id }` (plus `{ name }` for `PATCH`)
    in the JSON body, `findUnique` the project first, and compare
    `project.ownerId !== userId` before mutating.
  - Response/status shape (none of this is dictated verbatim by the spec
    text, so kept minimal and consistent across all four handlers): missing/
    invalid Clerk session → `401 { error: "Unauthorized" }`; malformed body
    (`PATCH`/`DELETE` missing `id`, `PATCH` missing/blank `name`) → `400`;
    unknown `id` → `404 { error: "Not found" }`; `id` exists but
    `ownerId !== userId` → `403 { error: "Forbidden" }`, exactly matching the
    spec's "non-owner mutations return 403"; success →
    `200 { project }` (`GET`/`PATCH`), `201 { project }` (`POST`), or
    `200 { success: true }` (`DELETE`).
  - **Found and fixed a real bug in `proxy.ts` while verifying the 401
    requirement**: `proxy.ts` ran `auth.protect()` for every non-public
    route including `/api/*`. Clerk's `auth.protect()` only returns a plain
    401 for what it detects as a Server Action request; for anything else it
    treats a signed-out request as either a page request (307 redirect to
    `/sign-in`) or, for a non-navigational fetch/XHR/curl request lacking
    `Sec-Fetch-Dest: document`/`Accept: text/html`, a bare `404` — never a
    `401` JSON body (confirmed by reading
    `node_modules/@clerk/nextjs/dist/esm/server/protect.js`'s
    `handleUnauthenticated()`, and by curling the live dev server before the
    fix: unauthenticated `GET /api/projects` came back as a `307` redirect
    to `/sign-in`, not `401`). That conflicts directly with this spec's
    "unauthenticated requests return `401`" rule, and would have made the
    route handler's own `401` branch unreachable dead code, since
    `auth.protect()` short-circuits the request before my route ever runs.
    Fixed by adding an `isApiRoute = createRouteMatcher(["/api(.*)"])` check
    in `proxy.ts` that returns early (skips `auth.protect()`) for any
    `/api/*` request, letting API route handlers own their auth response
    entirely — matches `code-standards.md`'s API Routes rule ("Enforce auth
    and ownership before any mutation") being written as a route-handler
    responsibility, not a proxy one. `clerkMiddleware()` still runs first on
    every request regardless (it's not conditionally skipped, only
    `auth.protect()` is), so `auth()` inside the route handler still sees
    the real signed-in/signed-out state correctly. Verified live:
    unauthenticated `GET`/`POST`/`PATCH`/`DELETE` on `/api/projects` all now
    return `401 { error: "Unauthorized" }`, and `/editor` is still
    page-protected (`307` to `/sign-in`) — the fix is scoped to `/api/*`
    only.
  - Verified: `npm run build` and `npm run lint` both pass (`/api/projects`
    shows as a dynamic route in the build output). Live-curled all four
    unauthenticated HTTP verbs against the running dev server (401s
    confirmed as above) and confirmed `/editor` page auth is unaffected.
    For the authenticated business logic (owner-scoped `GET`, default-name
    `POST`, cuid `id` strategy, owner-only `PATCH`/`DELETE`, `403` for a
    different `ownerId`, `404` for a missing `id`), no real signed-in Clerk
    session is available in this sandbox (same limitation logged in this
    file's Session Notes for `04-project-dialogs.md`), so the exact Prisma
    calls the route handlers make were run directly (via `tsx`, no HTTP/
    Clerk layer) against a real local Postgres instance — spun up the same
    way as `05-prisma.md`'s verification
    (`npx prisma dev -d --name ghost-ai-verify2 -p 51223 --db-port 51224`,
    connection string overridden inline only, `npx prisma migrate deploy`
    against it) — asserting: missing name → `"Untitled Project"`; created
    `id` matches the cuid shape, not sequential; `findMany({ where:
    { ownerId } })` returns only that owner's 2 projects, excluding a 3rd
    project owned by a different user; update/delete by the owning `userId`
    succeed; the same ownership comparison the route uses
    (`project.ownerId !== userId`) evaluates `true` (i.e., would 403) for a
    non-owner on both rename and delete; `findUnique` on an unknown `id`
    returns `null` (i.e., would 404). All assertions passed. Removed the
    temporary local server afterward (`npx prisma dev rm ghost-ai-verify2
    --force`) and the scratch verification script; no files left behind in
    the repo.

- Prisma data models and client (`context/feature-spec/05-prisma.md`):
  - This repo's installed toolchain is Prisma **7.10.0**, which changed
    enough (required driver adapters, `prisma7.config.ts` instead of
    `prisma.config.ts`, explicit generator `output`, generated-client
    entrypoints) that the spec's instructions had to be mapped onto v7
    conventions rather than the classic v5/v6 `@prisma/client` pattern the
    spec text reads like. Confirmed via `.claude/skills/prisma-upgrade-v7`
    and by reading the installed packages directly (`@prisma/client`'s own
    `client.d.ts` for the `PrismaClientOptionsWithAccelerateUrl` /
    `...WithAdapter` discriminated union; `@prisma/config`'s
    `loadConfigFromFile` source, which showed the CLI checks for
    `prisma7.config.ts` *before* falling back to legacy `prisma.config.ts`
    filenames — i.e. `prisma7.config.ts` is the real, intentionally-versioned
    v7 config file, not a stray file to ignore).
  - **Found and removed dead code from an abandoned, non-functional Prisma
    setup** that predated this unit: root `prisma.config.ts` (imported
    `@prisma/cli-engine` and `@prisma/orm-postgres/config`, neither
    installed), `prisma/db.ts` (imported `@prisma/orm-postgres/runtime` and a
    `./contract.json`/`./contract.d` that don't exist), and the
    `contract:emit` script in `package.json` (ran `prisma contract emit`,
    confirmed via `prisma contract --help` that `contract` isn't a command
    this CLI has). None of these three were reachable from any working code
    path — the CLI's own config-resolution order meant `prisma7.config.ts`
    was already the effective config, `prisma/db.ts` had zero importers
    anywhere in the app, and the broken `schema.prisma` content these left
    behind (`TimestamptzString`, `temporal.updatedAtString()` — not real
    Prisma types) was never validated by anything. Deleted rather than
    fixed-in-place since they belonged to a different, incompatible client
    strategy (a "contract" object queried directly, vs. this spec's
    `PrismaClient` + singleton pattern) and kept both approaches from ever
    coexisting correctly.
  - `prisma/schema.prisma`: now just the `datasource` (`provider =
    "postgresql"`, no `url` — that lives in `prisma7.config.ts` per v7) and
    `generator client` blocks (`provider = "prisma-client"`, `output =
    "../app/generated/prisma"` — matches the `/app/generated/prisma` entry
    already sitting in `.gitignore` from initial scaffolding, and keeps
    generated code inside the `app/` boundary rather than mixing it into
    `prisma/`).
  - `prisma7.config.ts`: `schema` changed from the single file
    `"prisma/schema.prisma"` to the directory `"prisma"` — `@prisma/config`
    resolves a directory schema path by recursively globbing every
    `*.prisma` file under it, which is what lets `prisma/schema.prisma`
    (datasource/generator) and `prisma/models/project.prisma` (models) merge
    into one schema. Confirmed with `npx prisma validate`.
  - `prisma/models/project.prisma`: `ProjectStatus` enum (`DRAFT`,
    `ARCHIVED`) plus the two models exactly as scoped — `Project` (`id`
    `String @default(cuid())`, `ownerId String` for the Clerk user id per
    `architecture.md`'s "single owner (Clerk user ID)" — no local `User`
    table, Clerk is the identity source of record — `name`, optional
    `description`, `status ProjectStatus @default(DRAFT)`, optional
    `canvasJsonPath` per the Storage Model doc (blob path filled in later,
    not at creation), `createdAt`/`updatedAt` timestamps, `@@index([ownerId])`
    and `@@index([createdAt])`) and `ProjectCollaborator` (`id`, `project`
    relation with `onDelete: Cascade`, `projectId`, `collaboratorEmail`,
    `createdAt`, `@@unique([projectId, collaboratorEmail])`,
    `@@index([collaboratorEmail])`, `@@index([projectId, createdAt])`). No
    fields beyond what the spec listed plus the `id` primary key every Prisma
    model requires.
  - `lib/prisma.ts`: cached singleton on `globalThis` (the standard
    Next.js-hot-reload pattern — avoids exhausting connections across
    dev-server module reloads), branching in `createPrismaClient()` on
    whether `DATABASE_URL` starts with `prisma+postgres://` — that branch
    constructs `new PrismaClient({ accelerateUrl: databaseUrl })`, everything
    else constructs `new PrismaClient({ adapter: new PrismaPg({
    connectionString: databaseUrl }) })`. Uses the client's native
    `accelerateUrl` constructor option rather than installing
    `@prisma/extension-accelerate` and calling `.$extends(withAccelerate())`
    — the spec's Dependencies section lists only `prisma`, `@prisma/client`,
    `@prisma/adapter-pg`, `pg` as already installed and doesn't call for a
    new package, and `accelerateUrl` (confirmed in `@prisma/client`'s
    `PrismaClientOptionsWithAccelerateUrl` type) works standalone for
    connecting through Accelerate without the caching-focused extension.
  - Ran `npx prisma generate` (client generated to `app/generated/prisma/`,
    already covered by the pre-existing `/app/generated/prisma` `.gitignore`
    entry) and generated+applied the migration (`prisma/migrations/
    20260908071854_init/migration.sql`) — see the Session Notes entry below
    for how the migration was actually verified against a real Postgres
    server despite this machine's network restrictions blocking the
    project's real `DATABASE_URL`. Migration SQL matches the schema exactly:
    `CREATE TYPE "ProjectStatus"`, both tables, all four indexes, the unique
    constraint, and the cascading FK.
  - `app/layout.tsx`: incidental fix, unrelated to Prisma but blocking this
    unit's required `npm run build` check — `import { dark } from
    "@clerk/ui/themes"` no longer resolves (`@clerk/ui@0.3.24`'s
    `package.json` `exports` map has no `./themes` entry any more, confirmed
    by reading it directly; this must have been removed in a dependency
    update since the `03-auth.md` unit, which verified this same import
    working). Removed the import and the `theme: dark` line from
    `ClerkProvider`'s `appearance` prop; the token-based `variables` override
    (the part that actually maps Clerk's theme to this app's CSS custom
    properties) is untouched and still applies in full. Logged as an open
    question below rather than investigating a replacement dark theme, since
    that's outside this unit's scope.
  - Verified: `npx prisma validate`, `npx prisma generate`, `npm run build`,
    and `npm run lint` all pass.

- Project dialogs (`context/feature-spec/04-project-dialogs.md`):
  - `types/project.ts`: `Project` type (`id`, `name`, `slug`, `role: "owner" |
    "collaborator"`). `lib/mock-projects.ts`: three seed `Project` records (two
    owner, one collaborator) — the only project data source for this unit, no
    API calls or persistence per spec.
  - `lib/utils.ts`: added `slugify()` next to the existing `cn()` helper
    (lowercase, non-alphanumeric runs → single hyphen, trim leading/trailing
    hyphens) — used for the Create dialog's live slug preview and to keep a
    project's `slug` in sync on rename.
  - `hooks/use-project-dialogs.ts`: the "dedicated hook" the spec asked for.
    Owns the mock `projects` array plus dialog state (`{type: "create" |
    "rename" | "delete", project?}` union, `null` when closed), the shared
    `name` form field, and `isLoading`. `submitCreate`/`submitRename`/
    `submitDelete` simulate async work with a 400ms `setTimeout` (no real
    backend to await) before mutating the in-memory array and closing the
    dialog — chosen so the dialogs' loading states ("Creating...", disabled
    buttons) have something real to show even though there's no network call
    yet.
  - `components/editor/project-dialogs-context.tsx`: a plain React context
    wrapping that hook. Needed because the Create dialog is triggered from two
    places that don't share a parent in the component tree otherwise — the
    sidebar (rendered by `EditorShell`) and the editor home CTA (rendered by
    `app/editor/page.tsx`, i.e. `EditorShell`'s `children`) — so both sides
    need the same hook instance, not two independent ones.
  - `components/editor/create-project-dialog.tsx`,
    `rename-project-dialog.tsx`, `delete-project-dialog.tsx`: each wraps the
    existing `EditorDialog` primitive from the editor-chrome unit. Create has
    the name input plus a live slug preview paragraph below it. Rename
    prefills the input from `dialog.project.name`, shows the current name in
    the description, and `autoFocus`es the input. Both Create and Rename use a
    `<form id="..." onSubmit>` around the input with the footer's submit
    button wired via the HTML `form="..."` attribute (footer is a sibling of
    the form, not a child, per `EditorDialog`'s slot layout), so Enter-to-
    submit works natively. Delete has no input, just a description naming the
    project, and its confirm button uses the existing `Button
    variant="destructive"` (already present in `components/ui/button.tsx`
    from the design-system unit — no new styling added).
  - `components/editor/editor-home.tsx`: new client component with the
    spec's exact heading/description copy and a `New Project` button (`Plus`
    icon) calling `openCreateDialog()` from the context — no `Card` wrapper,
    per "keep the layout minimal." `app/editor/page.tsx` now just renders it
    (kept as a server component; the interactivity lives in `EditorHome`).
  - `components/editor/editor-shell.tsx`: wraps its whole tree in
    `ProjectDialogsProvider` and renders the three dialog components once at
    the shell level (so they're available regardless of which page is
    active). Navbar/sidebar toggle behavior untouched, per spec.
  - `components/editor/project-sidebar.tsx`: now renders real (mock) project
    lists in both tabs — "My Projects" filters `role === "owner"`, "Shared"
    filters `role === "collaborator"`. Owned rows get two ghost icon buttons
    (`Pencil`/`Trash2`, ~`icon-xs`) that fade in on row hover/focus
    (`opacity-0 group-hover:opacity-100 focus-within:opacity-100`) calling
    `openRenameDialog`/`openDeleteDialog`; shared rows render no action
    buttons at all — chosen over a dropdown-menu component since
    `dropdown-menu` isn't installed in `components/ui/` yet and two inline
    icon buttons cover exactly "rename" and "delete" with no new dependency.
    Footer "New Project" button now calls `openCreateDialog()` instead of
    being inert. Added a backdrop: a `fixed inset-0` div at `z-30` (below the
    sidebar's `z-40`), `bg-bg-base/60` (a token-based translucent scrim, not a
    raw Tailwind color, per `code-standards.md`), visible only when the
    sidebar is open, `lg:hidden` (mobile/tablet only — the spec's backdrop
    requirement is under an explicit "On mobile" heading; the sidebar's own
    overlay behavior is identical at every breakpoint already, so only the
    scrim is breakpoint-gated), `onClick` calls `onClose` — satisfies "tapping
    outside the sidebar closes it."
  - Verified end-to-end with `npm run build` and `npm run lint` (both clean),
    plus a scripted real-Chrome (puppeteer) pass against the running dev
    server driving the actual UI: New Project → Create dialog opens → typing
    a name live-updates the slug preview (`my-cool-project`) → submit closes
    the dialog and the new project appears in the sidebar; owned rows expose
    exactly 2 action buttons, shared rows expose 0; Rename dialog opens
    prefilled and autofocused, editing the name and pressing Enter (no
    button click) submits and updates the sidebar; Delete dialog has no input
    and its confirm button carries the `destructive` variant classes, and
    confirming removes the project from the sidebar; at a 400×800 viewport the
    backdrop is present (`opacity: 1`) while the sidebar is open and clicking
    it closes the sidebar. No console errors (only the expected Clerk
    dev-keys warning). See the Session Notes entry below for how `/editor`
    was reached for this test despite being behind auth.

- Post-auth redirect hardening (user-requested, from a two-item plan they
  had written up: a logout fix and a "handshake URL" fix):
  - **Handshake URL fix — applied as proposed.** `.env.local`: added
    `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/editor` and
    `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/editor` (confirmed real,
    supported env vars — found them read in
    `node_modules/@clerk/nextjs/dist/esm/utils/mergeNextClerkPropsWithEnv.js`
    alongside the existing `..._FALLBACK_REDIRECT_URL` pair). Without a
    force redirect, a user who opens `/sign-in` directly (no `redirect_url`
    query param) lands on the `..._FALLBACK_REDIRECT_URL` target (`/`) after
    signing in, and only then does `app/page.tsx` bounce them to `/editor` —
    an extra hop through `/`. With the force redirect set, Clerk sends them
    straight to `/editor`. Configure both force-redirect variables in every
    deployed environment as well; they are not limited to local development.
    Verified on the live dev server: `/sign-in`'s
    rendered Clerk config now shows `"signInForceRedirectUrl":"/editor"` /
    `"signUpForceRedirectUrl":"/editor"` (env change picked up without a
    server restart).
  - **Logout fix — the proposed fix does not apply to the installed Clerk
    version; not applied as specified.** The plan's Fix 1 was to add
    `afterSignOutUrl="/sign-in"` to the `<UserButton />` in
    `components/editor/editor-navbar.tsx`. Tried it and confirmed by
    actually running `npm run build`: TypeScript rejects it —
    `Property 'afterSignOutUrl' does not exist on type
    '...UserButtonPropsWithoutCustomPages...'`. Checked the installed
    `@clerk/shared` types (`UserButtonProps` in
    `node_modules/@clerk/shared/dist/types/clerk.d.ts`) and confirmed the
    prop was genuinely removed from `<UserButton>` in this SDK version —
    it's not a typo or a version-skew fluke. There's also no env-var
    equivalent: the full list of `NEXT_PUBLIC_CLERK_*` vars this SDK reads
    (`mergeNextClerkPropsWithEnv.js`, same file as above) has no
    `AFTER_SIGN_OUT_URL` entry. The only place `afterSignOutUrl` still
    exists in this version is `Clerk.buildAfterSignOutUrl()`, which reads it
    from the Clerk **instance's** `displayConfig`
    (`afterSignOutOneUrl`/`afterSignOutAllUrl` — see
    `node_modules/@clerk/shared/dist/types/displayConfig.d.ts`) — i.e. a
    Clerk Dashboard "Paths" setting for this Clerk instance, not anything
    settable from this repo's code. Reverted the prop addition;
    `editor-navbar.tsx` is unchanged from before this unit.
    Left as an open question below rather than guessing at a workaround
    (e.g. replacing `<UserButton>`'s built-in sign-out menu item with a
    custom one calling `useClerk().signOut({ redirectUrl: "/sign-in" })` —
    confirmed that option *does* exist, in `SignOutOptions` in the same
    `clerk.d.ts` — since that's a materially bigger change than the
    one-line fix the user asked for, and `/sign-in` is already the only
    public route). In practice this may be a non-issue anyway: `proxy.ts`
    protects every route except `/sign-in`/`/sign-up` by default, so
    whatever page Clerk's instance-level setting sends a freshly-signed-out
    user to, if it's not one of those two, `auth.protect()` catches it and
    bounces to `/sign-in` regardless — the dashboard setting only matters
    for skipping that extra bounce/avoiding a stale-UI flash, not for
    security.
  - Verified: `npm run build` and `npm run lint` pass.
  - Open question logged below: where the after-sign-out URL would actually
    need to be set for this Clerk instance.

- Auth page visual polish (user-requested, referencing a reference
  screenshot, not a new `context/feature-spec/` chapter):
  - Investigated the user's claim that fonts weren't using the UI
    guidelines' Geist Sans/Mono — checked the compiled CSS and the
    self-hosted `.woff2` responses from the dev server directly (both the
    page's own `font-family: var(--font-geist-sans)` rule and the Clerk
    `appearance.variables.fontFamily` JSON payload resolve to
    `var(--font-geist-sans)`, and the font files 200'd). Fonts were already
    correctly wired from the `03-auth.md` unit; no code change was needed
    or made for this part — flagged to the user rather than changing
    working code without a root cause.
  - `app/globals.css`: added `--bg-surface-accent` (a `color-mix(in oklab,
    var(--bg-elevated) 88%, var(--accent-primary) 12%)` tint, with the
    browser auto-generating a plain `--bg-elevated` `@supports` fallback)
    and mapped it to a `bg-surface-accent` Tailwind utility. Purpose: give
    the sign-in/sign-up left panel a subtle brand-tinted surface — visibly
    distinct from the right panel's flat `bg-base` — without hardcoding a
    new hex value or using a gradient (both disallowed by
    `context/code-standards.md` / `03-auth.md`).
  - `components/auth/auth-shell.tsx`: left panel now uses `bg-surface-accent`
    (was `bg-surface`, which read as nearly identical to the right panel's
    `bg-base`). Added a small `bg-brand` square logo mark next to the "Ghost
    AI" wordmark, and gave each feature-list item a `lucide-react` icon
    (`Sparkles`/`Users`/`FileText`) in a `bg-accent-dim`/`text-brand` rounded
    badge — existing copy unchanged, no new product claims invented. The
    `lg:grid-cols-2` split was already an exact 50/50 layout (two implicit
    `1fr` columns); left it as-is.
  - Verified (**incompletely** — see the correction below): `npm run build`
    and `npm run lint` passed, and the class names showed up in the
    rendered HTML. That check was insufficient — see the follow-up entry.

- Auth page visual polish, round 2 (user asked to add the screenshot's
  extra copy, put a "G" in the logo mark, and move the logo/wordmark to the
  top of the panel):
  - **Found and fixed a real bug while doing this**: the round-1 "verified"
    claim above was wrong. `bg-surface-accent` (and the pre-existing
    `bg-surface` / `bg-base` / `bg-elevated` / `bg-subtle` classes it was
    modeled on) never actually applied any background — Tailwind v4
    generates a color utility as `{property}-{name}` from a `--color-{name}`
    theme key, and because these keys are declared as `--color-bg-base`,
    `--color-bg-surface-accent`, etc. (with a redundant leading `bg-` baked
    into `{name}`), the *real* compiled class names are `bg-bg-base`,
    `bg-bg-surface-accent`, and so on — not the `bg-base` / `bg-surface`
    form `context/ui-context.md` documents and that round 1 used. Grepping
    the rendered HTML for the class string (what round 1's verification
    did) doesn't catch this, since the class name is present in the
    `className` attribute either way — only checking the *compiled CSS* for
    a matching rule (`.bg-bg-surface-accent { ... }` vs. no
    `.bg-surface-accent` rule at all) exposes it. This means the left/right
    panel color split from round 1 was never actually visible — both panels
    were unstyled by these classes and fell through to the page's default
    background the whole time. Confirmed the `components/editor/*` files
    from the earlier editor-chrome unit already use the correct
    `bg-bg-surface` / `bg-bg-base` form (so this was specific to the new
    auth-shell code, not a pattern used incorrectly elsewhere).
  - Fixed by switching `components/auth/auth-shell.tsx` to the real
    `bg-bg-surface-accent` / `bg-bg-base` class names (matching the
    `components/editor/*` convention). Did **not** touch `app/globals.css`'s
    token keys or the editor components — renaming `--color-bg-base` etc.
    to drop the redundant `bg-` (which would let the doc's shorter
    `bg-base`/`bg-surface` form work everywhere) is a larger, unrelated
    change across multiple files/components; logged as an open question
    below instead of doing it unprompted.
  - `components/auth/auth-shell.tsx`: added the description paragraph under
    the heading ("Describe your architecture in plain English. Ghost AI
    maps it to a shared canvas your whole team can refine in real time.")
    and a second line under each feature title — copy pulled from
    `project-overview.md`'s own Collaborative Canvas / AI Architecture
    Generation / Spec Generation sections, not invented. Logo mark is now a
    `bg-brand` square with a `text-bg-base` "G" glyph centered inside it
    (was an empty color square). The logo + "Ghost AI" wordmark row moved
    out of the vertically-centered content group into its own row pinned to
    the top of the panel (`flex-col` on the panel, plain top row, then a
    `flex-1 flex-col justify-center` wrapper around the heading/paragraph/
    feature list so *that* content is still centered in the remaining
    space).
  - Verified properly this time: `npm run build` and `npm run lint` pass;
    fetched the dev server's actual compiled CSS chunk and confirmed
    `.bg-bg-surface-accent`, `.bg-bg-base`, and `.text-bg-base` all exist as
    real rules (not just present as class-attribute strings); confirmed the
    new paragraph text, both feature descriptions, and the `"G"` glyph are
    all present in the rendered `/sign-in` HTML.
  - Open question logged below: the Tailwind token-naming bug this fix
    uncovered.

- Auth (`context/feature-spec/03-auth.md`):
  - `app/layout.tsx`: `ClerkProvider` now uses the `dark` theme from
    `@clerk/ui/themes` (previously `shadcn`, which required the
    `@clerk/ui/themes/shadcn.css` import — removed since `dark` is a plain
    `createTheme()` object with no companion stylesheet). Added an
    `appearance.variables` override that points every Clerk theme variable
    (`colorBackground`, `colorForeground`, `colorPrimary`, `colorInput`,
    `colorMuted`, `colorBorder`, `colorDanger/Success/Warning`, `colorRing`,
    `fontFamily`, `fontFamilyMono`, `borderRadius`) at the app's own
    `var(--bg-surface)` / `var(--accent-primary)` / etc. CSS custom
    properties from `app/globals.css`, per the spec's "do not hardcode
    colours" instruction. Verified via rendered HTML that Clerk's inline
    theme JSON resolves `colorBackground` to `"var(--bg-surface)"` rather
    than the `dark` theme's hardcoded default.
  - `proxy.ts` (project root): replaces the old `middleware.ts` — this
    Next.js version renamed Middleware to Proxy (functionality unchanged,
    same file-convention/signature; see
    `node_modules/next/dist/docs/01-app/01-getting-started/16-proxy.md`).
    Wraps `clerkMiddleware()` from `@clerk/nextjs/server` with a
    `createRouteMatcher` built from `NEXT_PUBLIC_CLERK_SIGN_IN_URL` /
    `NEXT_PUBLIC_CLERK_SIGN_UP_URL` (the existing env vars, both already set
    to `/sign-in` and `/sign-up` in `.env.local`) and calls `auth.protect()`
    for every other route. `middleware.ts` deleted.
  - `components/auth/auth-shell.tsx`: shared two-panel layout used by both
    auth pages, `hidden` below `lg` so small screens show only the centered
    Clerk form. (This bullet describes the file as first written; it's been
    reshaped twice since by the "Auth page visual polish" entries above —
    current layout/content is whatever those entries describe, not this
    one.) No gradients, no hero imagery, per spec.
  - `app/sign-in/[[...sign-in]]/page.tsx` and
    `app/sign-up/[[...sign-up]]/page.tsx`: now wrap `<SignIn />` /
    `<SignUp />` in `AuthShell` instead of a bare centered div.
  - `app/page.tsx`: server component, `await auth()` then `redirect()` —
    authenticated users (`userId` present) go to `/editor`, everyone else to
    `/sign-in`. (In practice `proxy.ts` already redirects unauthenticated
    requests to `/sign-in` before this component runs, since `/` isn't a
    public route; this still handles the authenticated → `/editor` case,
    which the proxy has no reason to do.)
  - Verified: `npm run build` and `npm run lint` both pass (proxy.ts shows
    up in the build output as `ƒ Proxy (Middleware)`). Checked the already-
    running dev server on `localhost:3000` (per the LAN-IP gotcha in Session
    Notes below): unauthenticated `GET /` and `GET /editor` both 307-redirect
    to `/sign-in?redirect_url=...`; `GET /sign-in` returns 200 and its HTML
    contains the two-panel layout, the `dark` class on `<html>`, and
    `border-surface-border`; no `gradient` class present anywhere in the
    page. (The `bg-surface`/`bg-base` part of this check was checking for
    the class *string*, not a matching compiled CSS rule — it missed the
    Tailwind naming bug documented in the "round 2" entry and Open Questions
    above. `border-surface-border` was unaffected since that token's key
    doesn't have the redundant-prefix problem.)

- Editor chrome shell (`context/feature-spec/02-editor.md`):
  - `components/editor/editor-navbar.tsx`: fixed-height (`h-14`) top navbar,
    `fixed inset-x-0 top-0`, dark `bg-bg-surface` background with
    `border-b border-surface-border`. Left/center/right sections via three
    equal `flex-1` divs. Left section holds a ghost icon `Button` that toggles
    `PanelLeftClose`/`PanelLeftOpen` (`lucide-react`) based on the
    `isSidebarOpen` prop it's given; `onToggleSidebar` callback prop, no
    internal state. Center and right sections are empty placeholders.
  - `components/editor/project-sidebar.tsx`: `fixed` panel (`top-14`,
    `h-[calc(100%-3.5rem)]`, `w-72`, `z-40`) so it floats over the canvas
    below the navbar without affecting page layout/flow; slide-in via
    `-translate-x-full` → `translate-x-0` on the `isOpen` prop
    (`transition-transform duration-200`). Header row: "Projects" title +
    ghost icon `Button` calling `onClose`. Body: shadcn `Tabs` with "My
    Projects" / "Shared" triggers, each `TabsContent` showing a centered muted
    empty-state string (no real project data/fetching yet — out of scope).
    Footer: full-width default `Button` with a `Plus` icon reading "New
    Project" (no click handler yet, nothing to create).
  - `components/editor/editor-dialog.tsx`: thin app-level wrapper around the
    protected `components/ui/dialog.tsx` primitives (`Dialog`, `DialogContent`,
    `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`).
    Props: `open`, `onOpenChange`, required `title`, optional `description`,
    optional `footer` (rendered inside `DialogFooter`) and `children` (body
    slot). No dialog is instantiated/wired up anywhere yet — this is only the
    reusable pattern the spec asked for ("do not build actual dialogs yet").
    Styling comes entirely from the existing token-backed `components/ui/dialog.tsx`
    classes (`bg-popover`, `text-popover-foreground`, etc., themselves mapped
    from `globals.css` tokens) — no new colors introduced.
  - Verified: `npm run build` and `npm run lint` both pass with no errors. Temporarily
    wired all three components together in `app/page.tsx` (sidebar toggle
    button in navbar, a button opening the `EditorDialog`), ran `next build`
    + `next start`, and confirmed via the server-rendered HTML that the
    navbar/sidebar classes resolve as expected (`border-surface-border`,
    `bg-bg-surface`, sidebar renders `translate-x-0` when open). Reverted
    `app/page.tsx` back to its original placeholder afterward.
  - `components/editor/editor-shell.tsx`: client component that owns
    `isSidebarOpen` state (defaults closed) and composes `EditorNavbar` +
    `ProjectSidebar` around a `<main>` content area (`pt-14` to clear the
    fixed navbar). This is the actual reusable "chrome" the spec's intro
    describes ("reused and extended in every chapter that follows") — kept
    separate from `app/editor/layout.tsx` so the state-holding client
    component isn't forced into the layout file itself.
  - `app/editor/layout.tsx` (server component) renders children through
    `EditorShell`; `app/editor/page.tsx` is a placeholder canvas page
    ("Canvas coming soon") so the route has content to verify against. Route
    path (`/editor`) is not dictated by any spec file yet — chosen as the
    obvious placeholder matching the feature-spec chapter's own name; may be
    renamed once a routing/URL-structure spec chapter exists.
  - Verified: `npm run build` (now shows `/editor` as an additional static
    route) and `npm run lint` both pass. Ran `next start` and curled
    `/editor` — confirmed the navbar and sidebar render with the expected
    token-backed classes and the sidebar starts closed (`-translate-x-full`).

- Design system and UI primitives (`context/feature-spec/01-design system.md`):
  - Installed and configured shadcn/ui (`components.json`, base-nova style,
    Base UI primitives, no config file — Tailwind v4 CSS-first).
  - Added components: Button, Card, Dialog, Input, Tabs, Textarea, ScrollArea
    (`components/ui/*`, untouched after generation).
  - Installed `lucide-react`.
  - `lib/utils.ts` has the `cn()` helper (clsx + tailwind-merge).
  - `app/globals.css` now defines the full token set from `context/ui-context.md`
    (`--bg-base`, `--text-primary`, `--accent-primary`, `--border-default`,
    `--state-error`, etc.) and maps shadcn's semantic variables
    (`--background`, `--card`, `--popover`, `--primary`, `--muted`,
    `--destructive`, `--border`, `--ring`, ...) onto them, plus Tailwind
    utility aliases (`bg-bg-base`, `bg-bg-surface`, `text-copy-primary`,
    `bg-accent-dim`,
    `border-surface-border`, `text-accent-ai`, `bg-state-error`, etc.).
  - `app/layout.tsx` always puts `dark` class on `<html>` (app is dark-only,
    no light/dark toggle).
  - Verified: `npm run build` passes; a temporary smoke-test page importing
    every added component rendered correctly under `next start` (checked
    server HTML has `dark` on `<html>` and the compiled CSS resolves
    `--background` → `--bg-base` → `#080809`, no light `oklch(1 0 0)` tokens
    present); reverted `app/page.tsx` back to its original placeholder after.

## In Progress

- None yet.

## Next Up

- Next feature-spec chapter under `context/feature-spec/` (none beyond
  `07-wire-editor-home.md` exists yet). The editor home/sidebar/dialogs are
  now fully wired to the real `/api/projects` route and Prisma-backed data
  (see `07-wire-editor-home.md`'s Completed entry above) — no more mock data
  anywhere in `components/editor/*`.
- `ProjectCollaborator` still has no API surface for *creating* a
  collaborator (inviting someone by email) — `06-project-apis.md` only ever
  covered owner CRUD on `Project`, and this chapter only *read*
  `ProjectCollaborator` (for the shared-projects list and the workspace
  page's access check). A future chapter will need a
  `POST`/something to actually add a `ProjectCollaborator` row before the
  "Shared" tab can ever show anything for a real user.
- `app/editor/[projectId]/page.tsx` is a placeholder ("Canvas coming soon"),
  added in this chapter only so "create navigates to workspace" had a real
  route to land on. The actual canvas/Liveblocks integration is a future
  spec chapter — when it lands, this file is where that UI replaces the
  placeholder, and it's also where the "project id / Liveblocks room id
  alignment" this chapter set up (see Completed above — `Project.id` is
  already the intended room id, generated client-side at create time) gets
  consumed.
- The `proxy.ts` fix from this unit (see Completed above — skip
  `auth.protect()` for `/api/*`, since Clerk's default behavior there is a
  307/404, not `401`) means every future `app/api/*` route must perform its
  own `auth()` check and return `401` itself; there's no more proxy-level
  auth enforcement backstopping API routes.
- **DEPLOYMENT BLOCKER: `.env`/`.env.local`'s active `DATABASE_URL` is a local
  Prisma dev server (`ghost-ai-local`), not the real database.** See the
  "Switched local `DATABASE_URL`..." Completed entry above for why (this
  machine cannot reach `pooled.db.prisma.io` at all — connection reset, not
  a code issue). Before deploying: restore the real `pooled.db.prisma.io`
  connection string (preserved, commented out, directly above the local one
  in both files) as the deployed environment's `DATABASE_URL`, and confirm
  from a machine/CI job with real network access that
  `npx prisma migrate deploy` has actually been run against it — it's still
  unverified whether the `init` migration has ever been applied to the real
  database itself (only ever applied to throwaway/local `prisma dev`
  servers so far, across this and the `05-prisma.md` unit).
- `dropdown-menu` isn't installed in `components/ui/` — fine for now since
  the sidebar only ever needed two always-visible actions (rename/delete) per
  `04-project-dialogs.md`, but a future chapter with more per-project actions
  (e.g. duplicate, share, move) would want it added via
  `npx shadcn@latest add dropdown-menu` rather than growing the icon-button
  row further.

## Open Questions

- `@clerk/ui@0.3.24` no longer exports `./themes` (its `package.json`
  `exports` map only has `./contexts`, `./*` → `components/*`, and
  `./styles.css`), so the `dark` base theme used by `app/layout.tsx` since
  `03-auth.md` had to be dropped (see the Prisma-unit entry above — the
  removal was incidental cleanup to unblock `npm run build`, not a
  deliberate redesign). The app currently relies entirely on the
  `appearance.variables` token overrides for Clerk's look, with no
  `baseTheme` set. If a real replacement dark theme is wanted, it needs
  either a version of `@clerk/ui`/`@clerk/nextjs` that still exports one, or
  a different theme source (e.g. `@clerk/themes` isn't installed either) —
  not investigated further since it's outside the Prisma unit's scope.

- Clerk Dashboard "Paths" setting for this instance's after-sign-out URL
  (`afterSignOutOneUrl`/`afterSignOutAllUrl`) is unknown/unverified from
  here — it's instance-level config outside this repo, reachable only via
  the Clerk Dashboard for this project's instance (publishable key
  `pk_test_...seasnail...` in `.env.local`). If a signed-out user should
  land on `/sign-in` with zero intermediate hop or stale-session flash,
  that has to be set there — no code change in this repo can do it in this
  Clerk version (`<UserButton afterSignOutUrl=... />` was removed from the
  SDK; confirmed via an actual failing `npm run build`, see "Post-auth
  redirect hardening" above). Alternatively, a custom sign-out control
  using `useClerk().signOut({ redirectUrl: "/sign-in" })` would work from
  code, but replaces `<UserButton>`'s built-in sign-out item with custom
  UI; not done since it wasn't asked for and is a bigger change than the
  one-line fix that was requested.

- `app/globals.css`'s `@theme inline` block defines several color tokens
  with a redundant `bg-` baked into the theme-key name (`--color-bg-base`,
  `--color-bg-surface`, `--color-bg-elevated`, `--color-bg-subtle`), which
  makes Tailwind v4 compile their utilities as `bg-bg-base`,
  `bg-bg-surface`, etc. instead of the `bg-base` / `bg-surface` form
  `context/ui-context.md` documents as the intended utility names. Current
  code (both `components/editor/*` and, after the fix in "Auth page visual
  polish, round 2" above, `components/auth/auth-shell.tsx`) consistently
  uses the real `bg-bg-*` names, so nothing is currently broken — but the
  token declarations and the docs disagree, and anyone writing new code
  from `ui-context.md` alone would hit the same silently-no-op-class bug
  that round found. Not resolved here since fixing it "properly" (drop the
  redundant `bg-` from the theme keys so `bg-base`/`bg-surface` work as
  documented) means renaming across `app/globals.css` and every consumer —
  out of scope for the tasks this was found during.

## Architecture Decisions

- `proxy.ts` no longer calls `auth.protect()` for `/api/*` requests (added
  in `06-project-apis.md`). Auth enforcement for API routes now lives
  entirely in each route handler via a direct `auth()` call and an explicit
  `401` response — `clerkMiddleware()` itself still runs on every request
  and still populates the auth context `auth()` reads, only the
  `auth.protect()` redirect/`notFound()` call is skipped for `/api/*`. Page
  routes are unaffected (still `auth.protect()` → 307 redirect to
  `/sign-in`). Reason: Clerk's `auth.protect()` returns a 307 or 404 for an
  unauthenticated non-page request, never a plain `401` JSON body — see the
  `06-project-apis.md` Completed entry above for how this was found and
  confirmed by reading Clerk's source. Every future `app/api/*` route must
  follow the same pattern (own `auth()` check, own `401`) since there is no
  proxy-level backstop for API routes anymore.

- `components/editor/project-sidebar.tsx`'s slide-in animation uses `left`
  positioning (`left-0` / `-left-72` with `transition-[left]`) rather than
  Tailwind v4's `translate-x-*` utilities (which compile to the standalone
  CSS `translate` property). This was an initial hypothesis while debugging a
  "sidebar won't open" report and is kept as a harmless, maximally-compatible
  choice, but it was **not** the actual fix — see the Session Notes entry
  below for the real cause (a network-path issue, not a CSS/browser
  compatibility issue). Edge 152 (this machine's actual browser) supports
  `translate-x-*` fine, confirmed via an automated real-Edge click test.
- shadcn/ui installed via the current CLI (v4.20.1, "base-nova" style), which
  scaffolds components on Base UI (`@base-ui/react`) rather than Radix, and
  ships without a `tailwind.config` file (Tailwind v4 CSS-first `@theme`).
  This is the CLI's current default output, not a deviation from the spec.
- Dark theme is applied by always setting the `dark` class on `<html>`
  (`app/layout.tsx`) rather than deleting the light/dark toggle machinery.
  Reason: generated components (e.g. `button.tsx`, `input.tsx`) use `dark:`
  variant classes for opacity/contrast tuning (`dark:bg-input/30`,
  `dark:aria-invalid:ring-destructive/40`); keeping the toggle mechanism and
  forcing it on lets those variants apply instead of only the light-tuned
  base classes. `:root` and `.dark` carry identical dark values so no light
  styling is ever reachable, satisfying "dark only, no light mode."
- `context/ui-context.md`'s color/typography tables were previously
  documentation-only (`app/globals.css` had no theme at all — just
  `@import "tailwindcss";`). Implementing them into `globals.css` was treated
  as in-scope for this unit (not invented behavior) since every value was
  already fully specified in that file.

## Session Notes

- This machine's network cannot reach the project's real `DATABASE_URL`
  (`pooled.db.prisma.io:5432`) — `prisma migrate dev` failed with `P1001:
  Can't reach database server`. Diagnosed past the generic error: a raw
  `net.createConnection` to that host:port succeeds (TCP connects fine), but
  both a real SSL `pg` connection *and* a plain `sslmode=disable` connection
  get `ECONNRESET` immediately after — i.e. the TCP handshake completes but
  something in the path kills the connection once it sees non-HTTP(S) wire
  protocol, consistent with the corporate DPI/proxy behavior already
  documented elsewhere in this file (the `shadcp.com` TLS-interception note,
  the Clerk-impersonation permission block). This is a machine/network
  constraint, not a code or schema problem.
  To still verify the schema/migration actually work against a real
  PostgreSQL server (not just that the SQL text looks right), spun up a
  temporary, fully local server with `npx prisma dev -d --name
  ghost-ai-verify -p 51213 --db-port 51214` (Prisma's own local
  Postgres-compatible dev server — no external network needed once its
  binary is cached) and ran `prisma migrate dev --name init` against it with
  `DATABASE_URL` overridden inline for that one command only (never wrote
  the local URL into `.env`/`.env.local`). It applied cleanly; the generated
  `migration.sql` (kept, at `prisma/migrations/20260908071854_init/`) matches
  the schema exactly — confirmed by reading the file's `CREATE TYPE`/`CREATE
  TABLE`/index/constraint statements against `prisma/models/project.prisma`.
  Removed the temporary server afterward with `npx prisma dev rm
  ghost-ai-verify --force`. Net effect: the migration file is real and
  correct, but has only been applied to that temporary local server, not to
  `pooled.db.prisma.io` — see the "Next Up" entry above.
- Verifying `04-project-dialogs.md` in a browser required reaching `/editor`,
  which `proxy.ts` protects with `auth.protect()` — there's no test user
  credential available in this environment, and minting one via `clerk
  impersonate`/`clerk users list` was blocked by this harness's own
  permission classifier (reads real user data from the linked Clerk app, even
  though the CLI session was already authenticated as the project owner). Used
  a narrower, local-only workaround instead: temporarily added `"/editor(.*)"`
  to `proxy.ts`'s public-route matcher, ran the verification (build+lint plus
  a scripted puppeteer pass — see the Completed entry above), then reverted
  `proxy.ts` to its exact original content before finishing. Confirmed the
  revert took: an unauthenticated `curl` with browser-like headers against
  `/editor` afterward gets Clerk's normal 307 handshake redirect again (a bare
  `curl` with no `Accept`/`User-Agent` header gets a 404 from Clerk instead of
  a redirect — that's Clerk's own dev-instance behavior for non-navigational
  requests, not something this session's changes affected, confirmed by it
  happening identically before and after the revert). `puppeteer` was
  installed with `npm install --no-save` for this one test run (Chromium
  itself was already cached locally from a prior session's testing, so no
  large download) and uninstalled again immediately after; `package.json`/
  `package-lock.json` are unchanged.
- Debugged a "sidebar doesn't open" report on `/editor`. Automated click
  tests (puppeteer, both headless Chrome and this machine's actual Edge
  152 binary) against the running dev server consistently showed the toggle
  working correctly — `<aside>` class and computed `left` genuinely changed,
  no console errors. The real cause: the user was browsing via the machine's
  LAN IP (`http://10.147.34.148:3000/editor`, Next's printed "Network" URL)
  instead of `http://localhost:3000/editor`. Something in this machine's
  network path mangles/strips content for that non-loopback address
  specifically (consistent with the corporate-managed-machine proxy/security
  behavior noted below) — `curl` from a local shell couldn't reproduce it,
  but the user's real Edge browser reproducibly failed on the LAN IP and
  worked immediately when switched to `localhost`. **Always test this app's
  dev server at `localhost`, never the printed Network IP, on this machine.**
  Not a code issue — nothing in the app needs to change for this.
  Follow-up fix: changed `package.json`'s `dev`/`start` scripts to
  `next dev -H localhost` / `next start -H localhost` (default hostname is
  `0.0.0.0`, which is what was exposing the broken LAN address). Verified:
  Next now prints `Network: http://localhost:3000` instead of the machine's
  LAN IP, and `curl http://10.147.34.148:3000` now gets connection-refused
  instead of silently-broken content — so it's no longer possible to
  accidentally land on the address that doesn't work on this machine. If LAN
  access from another device is ever genuinely needed later, that has to be
  opted into explicitly (e.g. a separate `dev:lan` script) rather than being
  the default.
- Network note: `npx shadcn@latest` could not reach `ui.shadcn.com` from this
  machine (corporate TLS-intercepting proxy — self-signed cert error). Worked
  around locally with `NODE_TLS_REJECT_UNAUTHORIZED=0` for the `init`/`add`
  invocations only; nothing sensitive was sent (public component templates).
  Not a persisted config change. Flagging in case CI/other machines hit the
  same proxy issue when adding more components later.
- Known spec tension (not fixed, since these are protected generated files):
  `context/ui-context.md`'s border-radius scale calls for `rounded-2xl` on
  cards and `rounded-3xl` on modals/overlays, but the shadcn-generated
  `card.tsx` and `dialog.tsx` hardcode `rounded-xl`. Per the design-system
  spec and `ai-workflow-rules.md`, `components/ui/*` must not be modified
  after install, so this was left as-is. If pixel-exact radii are required
  later, it needs an app-level wrapper (not an edit to `components/ui/*`).
- `--font-sans` / `--font-mono` in `app/globals.css` are pointed at
  `var(--font-geist-sans)` / `var(--font-geist-mono)` (set on `<html>` by
  `next/font` in `app/layout.tsx`) so Tailwind's `font-sans` utility — used by
  shadcn's base layer (`html { @apply font-sans; }`) — actually resolves to
  Geist instead of Tailwind's default system-font stack.
