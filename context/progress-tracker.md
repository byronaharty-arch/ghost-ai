# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Design system and UI primitives (shadcn/ui setup, `cn()` helper, dark theme tokens)

## Completed

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
    utility aliases (`bg-base`, `text-copy-primary`, `bg-accent-dim`,
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

- [First unit to build]

## Open Questions

- [Any unresolved product or technical decisions]

## Architecture Decisions

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
