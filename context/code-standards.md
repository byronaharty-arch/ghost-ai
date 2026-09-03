# Code Standards

## General

- Keep modules small and single-purpose.
- Fix root causes - do not layer workarounds.
- Do not mix unrelated concerns in one component or route.
- Respect the system boundaries defined in `architecture.md`.

## TypeScript

- Strict mode is required throughout the project.
- Avoid any — use explicit interfaces or narrowly
  scoped types.
- Validate unknown external input at system
  boundaries before trusting it

## Next.js

- Default to React Server components.
- Add `"use client"` only when browser
  interactivity requires it, hooks or real-time state.
- Keep route handlers focused on a
  single responsibility
- Long-running work belongs in background tasks, not in request handlers.

## Styling

- Use CSS custom property tokens defined in `globals.css` - no raw Tailwind colour classes link `zinc-*` or hardcoded hex values.
- Follow the border radius scale defined
  in `ui-context.md`
- Reference tokens through their Tailwind utility names: `bg-base`, `text-copy-primary`, `text-brand`, etc. 

## API Routes

- Validate and parse request input before any logic runs
- Enforce auth and ownership before any mutation
- Return consistent, predictable response shapes
- Keep route handlers thin - push complexity into shared modules or background tasks.

## Data and Storage

- Metadata belongs in the database
- Large generated content belongs in file
  or blob storage
- Do not store large content directly in
  the database

## File Organization

- `lib/` — shared infrastructure: Prisma client, auth helpers, utilities.
- `trigger/` — all durable background tasks and AI workflow.
- `components/` — UI composition only; no business logic.
- `app/api/` — routes handlers for auth, triggering and persistence.
- Name files after the responsibility they contain, not the technology.
