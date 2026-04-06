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
       ↕  llama.cpp qwen-3b-tower (Tower P2000 GPU, port 11438)
       ↕  vLLM qwen-14b-awq (KXKM-AI RTX 4090) via tunnel port 11436
       ↕  TEI nomic-embed-text (KXKM-AI CPU) via tunnel port 11437
rag-web (React/nginx :80) → life-reborn /api/search, /api/alerts
makelife-cad (FastAPI :8001)  — accès direct depuis life-core
browser-runner (FastAPI :8010) — headless browser, web scraping
forgejo  jaeger  grafana  langfuse  otel-collector  traefik-forward-auth  keycloak
```

## Réseaux

- `life-internal` — communication inter-services (tous sauf life-web, rag-web)
- `traefik` — routage public via Traefik **local** (Let's Encrypt dnsChallenge Cloudflare)
- **SSH tunnel** `kxkm-ai-tunnel.service` (systemd user, persistant) : Tower → photon → KXKM-AI, 3 forwards :
  - `11436` → KXKM-AI:8000 (vLLM qwen-14b-awq, GPU)
  - `11437` → KXKM-AI:8001 (TEI nomic-embed-text, CPU)
  - `8889` → KXKM-AI:8889 (SearXNG)
- **llama.cpp local** : `llm-tower` container Docker, port 11438, Qwen2.5-3B Q4 sur P2000
- life-core atteint vLLM via `host.docker.internal:11436`, embeddings TEI via `host.docker.internal:11437`, LLM local via `host.docker.internal:11438`

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

## Authentification

Deux mécanismes d'auth coexistent — ne pas les confondre :

| Service | Mécanisme | Realm | Client ID |
|---------|-----------|-------|-----------|
| `life-web` | Client-side OIDC (`oidc-client-ts`, PKCE) | `electro_life` | `life-web` |
| `rag-web` | Client-side Keycloak JS | `electron_rare` | `rag-web` |
| `life-reborn` | JWT Bearer validation (middleware Hono) | `electro_life` | — (introspection) |
| langfuse, jaeger, grafana | `traefik-forward-auth` (`oidc-auth@docker`) | `electron_rare` | `oauth2-proxy` |

Flux OIDC life-web : `life-web` → `electro_life` → broker IDP → `electron_rare` (login) → retour avec token.

Config auth life-web : `life-web/src/lib/auth.ts`. Variables `VITE_KEYCLOAK_REALM` et `VITE_KEYCLOAK_CLIENT_ID` (compilées au build).

Keycloak realms gérés dans `suite-numerique/keycloak/*.json`. Scripts de sync dans `suite-numerique/scripts/`.

## Scripts ops

```bash
bash scripts/deploy_prod.sh              # déploiement production orchestré
bash scripts/bootstrap_keycloak_local.sh  # provisioning Keycloak local (realm electro_life)
```

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
- **Auth : ne pas mélanger forward-auth et client-side** — `life-web` utilise `oidc-client-ts` (pas de middleware Traefik). Ajouter `oidc-auth@docker` à life-web crée un double auth qui casse le flux OIDC.

## Repos GitHub L-electron-Rare

`factory-4-life` · `life-core` · `life-reborn` · `life-web` · `makelife-cad` · `finefab-life` · `finefab-shared` · `life-spec` · `makelife-hard` · `makelife-firmware` · `KIKI-models-tuning`
