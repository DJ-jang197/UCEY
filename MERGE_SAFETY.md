# Merge Safety Guide

This project has parallel work on backend, frontend, and data branches.
Use this workflow to prevent code loss during integration.

## Recovery points (already created)

- Backup branch: `backup/backend-20260307-133432`
- Backup tag: `backup-backend-20260307-133432`

If anything goes wrong, restore with:

```bash
git checkout -b restore-backend backup/backend-20260307-133432
```

## Safe workflow rules

1. Never force-push shared branches (`backend`, `frontend`, `main`).
2. Never use `git reset --hard` on shared branches.
3. Always make integration merges through a dedicated branch.
4. Keep each branch up to date before merging.
5. Resolve conflicts once, run tests, then merge.

## Integration branch flow

Create one temporary integration branch from backend:

```bash
git checkout backend
git pull --ff-only origin backend
git checkout -b integrate/frontend-data-<date>
```

Merge frontend safely:

```bash
git fetch origin
git merge --no-ff origin/HC_FrontEnd
```

Merge data safely:

```bash
git merge --no-ff origin/dataAdhyan
```

Run validation before pushing:

```bash
npm run lint
npm run typecheck
npm run build
```

Push integration branch and open PR:

```bash
git push -u origin integrate/frontend-data-<date>
```

## Conflict handling

When conflicts happen:

```bash
git status
```

Resolve files manually, then:

```bash
git add <resolved-files>
git commit
```

If merge must be canceled safely:

```bash
git merge --abort
```

## Optional extra backup before each major merge

```bash
ts=$(date +%Y%m%d-%H%M%S)
git branch "backup/pre-merge-$ts"
git push origin "backup/pre-merge-$ts"
```
