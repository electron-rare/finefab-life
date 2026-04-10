<!-- Parent: ../CLAUDE.md -->
<!-- Generated: 2026-04-07 -->

# finefab-life

## Purpose

FineFab runtime integration stack on Tower. Multi-service platform combining LLM routing, RAG retrieval, authentication gateway, operator cockpit, and public RAG portal. Monorepo of interconnected services orchestrated via docker-compose.prod.yml with shared infrastructure (Qdrant, Ollama, Redis, Keycloak, Langfuse).

## Key Files

| File | Description |
|------|-------------|
| `CLAUDE.md` | Architecture overview, compose stack topology, domain routing, deployment, and pitfalls |
| `docker-compose.prod.yml` | Production orchestration of all services, shared networks, volume mounts |
| `.env` | Local credentials (nc-rag-indexer, Qdrant access) |
| `README.md` | Quick reference for the stack |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `life-core/` | LLM router, RAG pipeline, multi-tier cache (FastAPI :8000) |
| `life-reborn/` | Auth gateway, rate-limiting, OpenAPI proxy (Hono :3210) |
| `life-web/` | Operator cockpit dashboard (React 19, nginx :80) |
| `rag-web/` | Public RAG chat/search/feed portal (React, nginx :80) |
| `nc-rag-indexer/` | Incremental indexer: Nextcloud/Outline/GitHub → Qdrant |
| `e2e-tests/` | Playwright end-to-end tests (18 test suites) |
| `makelife-cad/` | KiCad/EDA proxy service (FastAPI :8001) |
| `traefik/` | Local Traefik config, OIDC middleware definitions |
| `scripts/` | Operational scripts |
| `tests/` | Shared test fixtures |
| `otel/` | OpenTelemetry collector config (minimal) |
| `grafana/` | Grafana provisioning (dashboards, datasources) |

## For AI Agents

### Working In This Directory

1. **Service boundaries**: Each subdirectory under `life-*` is a separate git repo. Never assume monorepo structure — always check `.git` and run commands from within each service.
2. **Docker compose**: Commands must pass both `.env` and `/home/clems/.secrets/saillant-shared.env`. Always use the real path before running compose.
3. **Secrets management**: `.env` contains local credentials. `/home/clems/.secrets/saillant-shared.env` sourced from Infisical via `bash infisical/render_saillant_shared_env.sh`.
4. **Network isolation**: `life-internal` network carries inter-service traffic. Only `life-web` and `rag-web` run on isolated `traefik` network for public routing.
5. **SSH tunnel**: vLLM on KXKM-AI reachable via persistent systemd service `kxkm-ai-tunnel.service` (Tower → photon → KXKM-AI, port 11436). Inside Docker, use `host.docker.internal:11436`.

### Testing Requirements

1. **Unit tests**: Run from within each service directory (life-core pytest, life-reborn/life-web npm test).
2. **E2E tests**: Located in `e2e-tests/`. Require live services running. Use Playwright configs `auth-life.json` and `auth-rag.json` for authenticated flows.
3. **Docker health checks**: life-reborn waits for `life-core: service_healthy` (15s start_period due to LiteLLM startup).
4. **Traefik labels**: Changes to compose require `--force-recreate` to reload router labels. Verify TLS resolver is set (`tls.certresolver=letsencrypt`).
5. **Integration tests**: life-core tests Qdrant, Ollama, Redis connections. Set `QDRANT_URL=http://127.0.0.1:6333` if testing offline.

### Common Patterns

1. **Environment variables**: Build-time (`VITE_API_URL` in life-web/rag-web) vs. runtime (all others). Rebuilding services required for build-time changes.
2. **Authentication flow**: 
   - life-web/rag-web: Client-side Keycloak PKCE (oidc-client-ts)
   - life-reborn: Bearer token or Keycloak JWT validation
   - Protected endpoints (langfuse, jaeger, grafana): Traefik forward-auth via OIDC
3. **OpenAPI sync**: life-reborn generates client in `src/generated/`. Run `npm run openapi:generate` after API changes. Never hand-edit generated code.
4. **Logging & tracing**:
   - OTEL init only if `OTEL_EXPORTER_OTLP_ENDPOINT` defined
   - Langfuse tracing in life-core (callbacks, scoring)
   - Jaeger available at `jaeger.saillant.cc`
5. **RAG multi-collection**: life-core queries 4 Qdrant collections (`nextcloud_docs`, `outline_wiki`, `github_repos`, `life_chunks`) via `search_multi()` with optional per-collection filtering.

## Dependencies

### Internal

- `life-core` → Ollama (embeddings, summaries), Qdrant (4 collections), Redis (L2 cache)
- `life-reborn` → life-core (reverse proxy)
- `life-web` → life-reborn (API gateway), Keycloak client auth
- `rag-web` → life-reborn (search, chat, alerts), Keycloak client auth
- `nc-rag-indexer` → Nextcloud WebDAV, Qdrant (upsert), Outline API, GitHub API

### External

- **KXKM-AI (RTX 4090)**: vLLM qwen-14b-awq via SSH tunnel port 11436
- **Tower Ollama**: Embeddings (nomic-embed-text), summaries (qwen3:4b)
- **Keycloak**: Shared realm `electron_rare` (via traefik-forward-auth for `/langfuse/*`, `/jaeger/*`, `/grafana/*`)
- **Infisical**: Secret management for shared env (`saillant-shared.env`)
- **Let's Encrypt**: TLS via Cloudflare DNS challenge (Traefik local)
- **Langfuse**: Tracing and observability
- **Nextcloud**: WebDAV source for nc-rag-indexer
- **Outline wiki**: Crawl and sync via nc-rag-indexer
- **GitHub**: Repository indexing via nc-rag-indexer

<!-- MANUAL: -->
