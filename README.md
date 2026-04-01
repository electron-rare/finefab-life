# finefab-life

Integration runtime for the FineFab platform -- Docker Compose stack, CI/CD pipelines, and operational tooling.

Part of the [FineFab](https://github.com/L-electron-Rare) platform (FineFab).

## What it does

- Orchestrates all FineFab services into a single Docker Compose topology
- Manages CI/CD pipelines for cross-repo builds and releases
- Provides runbooks, health checks, and observability dashboards
- Handles environment configuration for local dev, staging, and production

## Tech stack

Docker Compose | GitHub Actions | Shell | Prometheus/Grafana

## Quick start

```bash
git clone git@github.com:L-electron-Rare/finefab-life.git
cd finefab-life
docker compose up -d
```

## Project structure

```
docker-compose.yml       Service topology
ops/                     Runbooks and operational scripts
scripts/                 Automation and deployment helpers
.github/workflows/       CI/CD pipeline definitions
```

## Related repos

| Repo | Role |
|------|------|
| [makelife-cad](https://github.com/L-electron-Rare/makelife-cad) | CAD/EDA web platform |
| [makelife-hard](https://github.com/L-electron-Rare/makelife-hard) | Hardware design (KiCad) |
| [makelife-firmware](https://github.com/L-electron-Rare/makelife-firmware) | Embedded firmware |
| [KIKI-models-tuning](https://github.com/L-electron-Rare/KIKI-models-tuning) | Model fine-tuning pipeline |

## License

MIT
