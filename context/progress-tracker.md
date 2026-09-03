# Progress Tracker

Update this file after every meaningful implementation
change.

## Current Phase

- In progress

## Current Goal

- Editor chrome: navbar, project sidebar, dialog pattern (`context/feature-spec/02-editor.md`)

## Completed

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

- Next feature-spec chapter under `context/feature-spec/` (none beyond
  `02-editor.md` exists yet — awaiting `03-*`). Likely candidates per
  `project-overview.md`: auth/project routes, or the collaborative canvas
  surface to fill in `app/editor/page.tsx`'s placeholder.

## Open Questions

- [Any unresolved product or technical decisions]

## Architecture Decisions

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
