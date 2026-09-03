# UI Context

## Theme

Dark only. No light mode. The visual language is a dark technical workspace - near - black backgrounds, layered surfaces and vivid accent colours for interactive elements.

## Colors

All colours are defines as CSS custom properties in `global.css` and mapped to tailwind tokens via `@theme inline`. Components must use these tokens - no hardcoded hex values or raw Tailwind colours classes like `zinc-*`.

| Role            | CSS Variable       | Value     |
| --------------- | ------------------ | --------  |
| Page background | `--bg-base`        | `#080809` |
| Surface         | `--bg-surface`     | `#111114` |
| Elevated surface| `--bg-elevated`    | `#18181c` |
| Subtle surface  | `--bg-subtle`      | `#1e1e23` |
| Primary text    | `--text-primary`   | `#f0f0f4` |
| Secondary text  | `--text-secondary` | `#c0c0cc` |
| Muted text      | `--text-muted`     | `#808090` |
| Faint Text      | `--text-faint`     | `#505060` |
| Brand accent    | `--accent-primary` | `#00c8d4` |
| Brand dim       | `--accent-primary-dim` | `rgba(0,200,212,0.12)` |
| AI accent       | `--accent-ai`      | `#6457f9` |
| AI text         | `--accent-ai-text` | `#8b82ff` |
| Subtle border   | `--border-subtle`  | `#3a3a42` |
| Default border  | `--border-default` | `#2a2a30` |
| Error           | `--state-error`    | `#ff4d4f` |
| Success         | `--state-success`  | `#34d399` |
| Warning         | `--state-warning`  | `#fbbf24` |

Tailwind utility names map to these variables. Use `bg-base`, `bg-surface`, `text-copy-primary`, `text-copy-muted`, `border-surface-border`, `text-brand`, `bg-accent-dim`, etc.

## Typography

| Role      | Font              | Variable            |
| --------- | ----------------- | -------------       |
| UI text   | Geist Sans        | `--font-geist-san`  |
| Code/mono | Geist Mono        | `--font-geist-mono` |

Both fonts are loaded via `next/font/google` and applied as CSS variables on the `<html>` element. The base `body` uses Geist Sans with `antialiased`.

## Border Radius

Radius increases with surface depth - smaller for inner elements, larger for outer containers.

| Context           | Class            |
| ----------------- | ---------------- |
| Inline / small UI | `rounded-xl`     |
| Cards / panels    | `rounded-2xl`    |
| Modals / overlays | `rounded-3xl`    |

## Canvas

### Node colour palette

8 defined colour pairs. Each pair specifies a dark node fill and a vivid contrasting text colour tuned for readability on the dark canvas. Defined in `types/canvas.ts` as `NODE_COLOURS`.

| Node fill     | Text colour     | Character              |
|---------------|-----------------|----------------------- |
|`#1F1F1F`      |`#EDEDED`        | Neutral dark (default) |
|`#10233D`      |`#52A8FF`        | Blue                   |
|`#2E1938`      |`#BF7AF0`        | Purple                 |
|`#331B00`      |`#FF990A`        | Orange                 |
|`#3C1618`      |`#FF6166`        | Red                    |
|`#3A1726`      |`#F75F8F`        | Pink                   |
|`#0F2E18`      |`#62C073`        | Green                  |
|`#062822`      |`#0AC7B4`        | Teal                   |

Default node colour: `#1F1F1F` with `#EDEDED` text.

## Component Library

shadcn/ui on top of Tailwind (base-nova style, Base UI primitives). Components
live in `components/ui/` and are never hand-edited after installation — use
`npx shadcn@latest add <component>` to add new ones. Installed so far: Button,
Card, Dialog, Input, Tabs, Textarea, ScrollArea. Dark theme tokens live in
`app/globals.css`, mapped to shadcn's semantic variables (`--background`,
`--card`, `--primary`, `--border`, etc.) so components need no per-project
overrides. `<html>` always carries the `dark` class (dark-only app). Use the
`cn()` helper from `lib/utils.ts` to merge Tailwind classes.

## Layout Patterns

- [Pattern — e.g. Editor: full-viewport split with
  left sidebar, center canvas, right sidebar]
- [Pattern — e.g. Sidebars: fixed width with border separator]
- [Pattern — e.g. Modals: centered overlay with backdrop blur]
- [Pattern — e.g. Navbar: top bar with bottom border]

## Icons

Lucide React (`lucide-react`). Stroke-based icons only. Sizes: h-4 w-4 for
inline, h-5 w-5 for buttons.
