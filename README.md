# finefab-life

Repository d'integration runtime FineFab (compose, operations, CI/CD, cockpit).

## Role
- Assembler les services FineFab pour execution locale/ops.
- Heberger les definitions d'environnements et d'orchestration.
- Centraliser runbooks et outils d'exploitation.

## Stack
- Docker
- Shell
- CI/CD

## Structure cible
- `docker-compose.yml`: topologie locale
- `ops/` et `scripts/`: operations, runbooks, automatisation
- `.github/workflows/`: pipelines d'integration

## Demarrage rapide
```bash
docker compose up -d
```

## Roadmap immediate
- Stabiliser stack d'observabilite.
- Standardiser procedures de run/rollback.
- Brancher pipelines de release inter-repos.
