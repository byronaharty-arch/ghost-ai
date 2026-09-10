This database schema is ready, build the backend project API routes only.

## Routes

Create REST endpoints for:

- `GET /api/projects`, list current user's projects
- `POST /api/projects`, create project
- `PATCH /api/projects`, rename project
- `DELETE /api/projects`, delete project

## Rules

Use the authenticated Clerk user ID as `ownerID`.

When creating:
- default missing project names to `Untitled Project`
- use the schema's existing ID strategy, do not add sequntial IDs

Security:
- unauthenticated requests return `401`
- only the projects owner can rename or delete
- non-owner mutations return `403`

Keep this backend-only. Do not wire the UI yet.