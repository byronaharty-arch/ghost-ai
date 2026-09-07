Clerk is already installed and connected. Please check that it has been wired into the Next.js app, including auth pages, redirects, route protection, and the user menu.

## Design

Use Clerk's `dark` theme from `@clerk/ui/themes` as the base.

Override Clerk appearance variables using the app's existing CSS variables. Do not hardcode colours.

### Sign-in and Sign-up pages:

- large screens: simple two-panel layout.
- left: compact logo, tagline, short, text-only feature list.
- right: centered Clerk form.
- small screens: form only.
- no gradients.
- no oversized hero sections.
- no feature cards.
- no scroll-heavy layouts.

Keep the layout minimal and professional.

## Implementation

Wrap the root layout with `ClerkProvider` using Clerk's `dark` theme.

Create sign-in and sign-up pages using Clerk components.

Use `proxy.ts` at the project root, not `middleware.ts`.

Define public routes using the existing sign-in and sign-up env vars. Protect everything else by default.

Update `/`:

- authenticated users redirect to `/editor` page.
- unauthenticated users redirect to `/sign-in` page.