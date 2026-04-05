# CLAUDE.md — finefab-life

Runtime d'intégration FineFab sur Tower. Code source dans org **L-electron-Rare** (GitHub privé).
Monorepo de référence : `L-electron-Rare/factory-4-life` — source de vérité pour architecture, tests, conventions.

## Where to Look

| Tâche | Répertoire |
|-------|-----------|
| LLM routing, RAG, cache, API `/chat` | `life-core/` → voir `life-core/CLAUDE.md` |
| Auth gateway, rate-limit, proxy vers life-core | `life-reborn/` → voir `life-reborn/CLAUDE.md` |
| Cockpit React opérateur | `life-web/` → voir `life-web/CLAUDE.md` |
| SPA RAG publique (Chat/Search/Feed) | `rag-web/` → voir `rag-web/CLAUDE.md` |
| Indexeur Nextcloud/Outline/GitHub → Qdrant | `nc-rag-indexer/` → voir `nc-rag-indexer/CLAUDE.md` |
| Tests E2E Playwright (API + portails) | `e2e-tests/` |
| Proxy KiCad/EDA | `makelife-cad/` |
| Config Traefik, middlewares OIDC | `traefik/` |
| Collecteur OTEL | `otel/config.yaml` |
| Provisioning Grafana | `grafana/provisioning/` |
| Scripts ops | `scripts/` |

## Stack compose (docker-compose.prod.yml)

```
life-web (React/nginx :80)
  → life-reborn (Hono :3210)
    → life-core (FastAPI :8000)
       ↕  qdrant :6333 (exposé 127.0.0.1)  redis :6379  langfuse :3000
       ↕  ollama (Tower, embeddings nomic-embed-text + résumés qwen3:4b)
       ↕  vLLM qwen-14b-awq (KXKM-AI RTX 4090) via SSH tunnel port 11436
rag-web (React/nginx :80) → life-reborn /api/search, /api/alerts
makelife-cad (FastAPI :8001)  — accès direct depuis life-core
forgejo  jaeger  grafana  langfuse  otel-collector  traefik-forward-auth  keycloak
```

## Réseaux

- `life-internal` — communication inter-services (tous sauf life-web, rag-web)
- `traefik` — routage public via Traefik **local** (Let's Encrypt dnsChallenge Cloudflare)
- **SSH tunnel** `kxkm-ai-tunnel.service` (systemd, persistant) : Tower → photon → KXKM-AI, port 11436. Remplace les anciens socat containers.
- life-core atteint vLLM via `host.docker.internal:11436`, Ollama local via `OLLAMA_URL` (embeddings) et `OLLAMA_EMBED_URL` (séparé si besoin)

## Domaines publics

| Domaine | Service | Middleware |
|---------|---------|-----------|
| `life.saillant.cc` | life-web | — (auth OIDC côté client via oidc-client-ts) |
| `api.saillant.cc` | life-reborn | — (JWT Keycloak dans life-reborn) |
| `rag.saillant.cc` | rag-web | — (auth Keycloak client `rag-web`, realm `electron_rare`) |
| `cad.saillant.cc` | makelife-cad | — |
| `git.saillant.cc` | forgejo | — |
| `langfuse.saillant.cc` | langfuse | `oidc-auth@docker` |
| `jaeger.saillant.cc` | jaeger | `oidc-auth@docker` |
| `grafana.saillant.cc` | grafana | `oidc-auth@docker` |

`oidc-auth@docker` = `traefik-forward-auth` → Keycloak realm `electron_rare`.

## Déploiement production

```bash
cd /home/clems/finefab-life
docker compose \
  --env-file /home/clems/finefab-life/.env \
  --env-file /home/clems/.secrets/saillant-shared.env \
  -f docker-compose.prod.yml up -d --build

# Rebuild un seul service
docker compose --env-file .env --env-file /home/clems/.secrets/saillant-shared.env \
  -f docker-compose.prod.yml up -d --build --force-recreate <service>
```

`--env-file` passé deux fois : `.env` (credentials locaux) + `saillant-shared.env` (Infisical).
Sans `--env-file`, Compose ne charge plus `.env` automatiquement depuis Compose v2.

## Pièges

- **TLS Traefik** : chaque router `websecure` doit avoir `tls.certresolver=letsencrypt` sinon 404 HTTPS.
- **Labels = recréation** : modifier le compose ne suffit pas — `--force-recreate` requis pour relire les labels.
- **VITE_API_URL** compilé au build — rebuilder `life-web` si l'URL API change.
- **OTEL conditionnel** — OTEL init seulement si `OTEL_EXPORTER_OTLP_ENDPOINT` est défini.
- **life-reborn** attend `life-core: service_healthy` (start_period 15s, LiteLLM lent).
- **Keycloak local** — ce stack a son propre Keycloak (`keycloak-postgres` + `keycloak`) distinct du Keycloak partagé de mascarade. Realm : `electro_life`.
- **Ne pas modifier** `life-reborn/src/generated/*` à la main — régénérer via `npm run openapi:generate && npm run client:generate`.

## Repos GitHub L-electron-Rare

`factory-4-life` · `life-core` · `life-reborn` · `life-web` · `makelife-cad` · `finefab-life` · `finefab-shared` · `life-spec` · `makelife-hard` · `makelife-firmware` · `KIKI-models-tuning`
