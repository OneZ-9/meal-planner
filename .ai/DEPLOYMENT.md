# DEPLOYMENT.md

## Status

Not yet deployed. This doc is the plan for when it happens — fill in the
real Vercel project URL and org once created.

## Target

Vercel, per spec Tech Stack. Next.js App Router deploys natively with no
extra config beyond environment variables.

## Planned procedure

1. Connect the GitHub repo (`OneZ-9/meal-planner.git`) to a new Vercel
   project. Vercel auto-detects Next.js.
2. Set environment variables in Vercel project settings (Production +
   Preview): `MONGODB_URI`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (set to the
   deployed domain, not localhost).
3. Create a Vercel Blob store (Storage tab) and connect it to this project
   — this provisions `BLOB_READ_WRITE_TOKEN` into the project's environment
   variables automatically (recipe image upload, see DECISIONS.md "Recipe
   image upload (Vercel Blob)"). Without this step, recipe create/edit
   still works, but uploading an image will fail.
4. Set the production branch to `main`. `dev` and `[developer]/dev` branches
   get automatic Vercel Preview deployments on push — useful for review
   without merging first.
5. First deploy: push to `main` (or trigger manually from Vercel
   dashboard) and confirm the build succeeds.

## Verification after deploy

- [ ] `/login` loads and sign-in works against the production MongoDB Atlas cluster.
- [ ] `/dashboard` loads post-login.
- [ ] Create a recipe → assign to calendar → generate shopping list →
      check an item, end to end, matching the spec's functional success
      measure.
- [ ] Confirm `NEXTAUTH_URL` matches the actual deployed URL (mismatches
      here are the most common cause of auth breaking only in production).
- [ ] Upload a recipe image on Create/Edit Recipe and confirm it renders on
      the Recipe Library card afterward (confirms the Blob store is
      actually connected, not just that `BLOB_READ_WRITE_TOKEN` is set).

## Rollback

Vercel keeps every previous deployment; rollback = promote a prior
deployment to Production from the Vercel dashboard, no redeploy needed.
No database migration/rollback story yet since there are no migrations —
schema changes are additive Mongoose schema edits only, at MVP stage.
