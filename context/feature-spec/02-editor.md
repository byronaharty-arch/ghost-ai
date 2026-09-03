We need the base chrome components that fram every editor screnn - the top navbar and the left sidebar shell. These will be reused and extended in every chapter that follows.

### Editor Navbar

create `component/editor/editor-navbar.tsx`.

Requirements:

- fixed-hight top navbar.
- left, center and right sections.
- left section contains sidebar toggle button.
- use `PanelLeftOpen`/`PanelLeftClose` icons based on sidebar state.
- right section stays empty for now.
- dark background with subtle bottom border.

### Project Sidebar

create `components/editor/project-sidbar.tsx`.

Requirements:

- sidebar should float above the editor canvas.
- opening it should not push page content.
- slides in from the left.
- accepts `isOpen` and `onClose` prop.
- header with `Projects` title + close button.
- shadcn `Tabs`:
    - My Projects
    - Shared
- both tabs show empty placeholder state.
- full-with `New Project` button at the bottom with `Plus` icon.

### Dialog Pattern

use the existing colour tokens from `global.scc` for dialog styling.

Support:

- title
- description
- footer action

Do not build actual dialogs yet.

### Checks when done

- new components compile without TypeScript errors.
- No lint errors.
- dialog pattern is ready for future use.