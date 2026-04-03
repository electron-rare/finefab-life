# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Runtime d'intégration FineFab — Docker Compose, Traefik propre, observabilité, ops Tower.
Ce répertoire est le **déploiement** sur Tower. Le code source vit dans les repos de l'org **L-electron-Rare** sur GitHub.
Le monorepo de référence est `L-electron-Rare/factory-4-life` (privé) — son CLAUDE.md est la source de vérité pour l'architecture, les tests et les conventions de code.

## Repos GitHub (org L-electron-Rare)

| Repo | Rôle | Langage |
|------|------|---------|
| **factory-4-life** (privé) | Monorepo de référence — submodules de tous les repos ci-dessous | Shell, Python |
| **life-core** | Backend IA — routeur LLM, RAG, cache, orchestration | Python/FastAPI |
| **life-reborn** | API gateway — auth, rate-limit, OpenAPI 3.1 | TypeScript/Hono 4 |
| **life-web** | Frontend cockpit opérateur | React 19/Vite |
| **makelife-cad** | Plateforme CAD/EDA assistée par IA | Python + Next.js 15 + Swift |
| **finefab-life** (ce repo) | Runtime Docker Compose, CI/CD, runbooks | Docker/Shell |
| **finefab-shared** | Contrats partagés — JSON Schema, types Pydantic/TS | Python, TypeScript |
| **life-spec** | Spécifications, gates BMAD, packs de conformité | Markdown/JSON |
| **makelife-hard** | Conception hardware — projets KiCad, exports PCB | KiCad/Python |
| **makelife-firmware** | Firmware embarqué ESP32/STM32, PlatformIO | C/C++ |
| **KIKI-models-tuning** | Pipeline fine-tuning — Unsloth, LoRA, registry | Python |

Org **electron-rare** : mascarade (LLM orchestration), Kill_LIFE (archivé → extended_life), YiACAD (EDA web), formations Moodle.

## Architecture déployée

```
life-web (React 19 + Vite, nginx :80)  →  life-reborn (Hono :3210)  →  life-core (FastAPI :8000)
                                                                             ↕
                                           makelife-cad (FastAPI :8001)  ←───┘
                                                                             ↕
                                           vLLM (KXKM-AI :8000)  +  Ollama (Cils :11434)
```

| Domaine public | Service | TLS | Middleware |
|----------------|---------|-----|-----------|
| `life.saillant.cc` | life-web | certresolver=letsencrypt | oidc-auth |
| `api.saillant.cc` | life-reborn | certresolver=letsencrypt | — |
| `cad.saillant.cc` | makelife-cad | certresolver=letsencrypt | — |
| `langfuse.saillant.cc` | langfuse | certresolver=letsencrypt | oidc-auth |
| `jaeger.saillant.cc` | jaeger | certresolver=letsencrypt | oidc-auth |
| `grafana.saillant.cc` | grafana | certresolver=letsencrypt | oidc-auth |
| `git.saillant.cc` | forgejo | certresolver=letsencrypt | — |

Auth : Keycloak realm `electro_life` via `traefik-forward-auth` (OIDC). life-reborn a aussi son propre auth middleware (Keycloak introspection ou token statique `LIFE_REBORN_API_TOKEN`).

## Machines

| Machine | IP | GPU | Rôle dans le stack |
|---------|-----|-----|-------------------|
| **Tower** | 192.168.0.120 | Quadro P2000 | Serveur principal — tous les containers Docker |
| **KXKM-AI** | 100.87.54.119 | RTX 4090 24GB | Inférence vLLM (port 8000 → proxy socat :11436) |
| **Cils** | 100.126.225.111 | CPU | Ollama (port 11434 → proxy socat :11435), Qdrant, docstore |
| **Photon** | 192.168.0.119 | — | Cloudflare tunnel, DNS |

## Development

### life-reborn — Hono API gateway (TypeScript, npm)

```bash
cd life-reborn
npm install
npm run dev              # tsx watch src/index.ts (port 3210)
npm test                 # vitest
npm run lint             # tsc --noEmit
npm run openapi:generate # régénère le spec OpenAPI
npm run client:generate  # régénère le client via orval
```

### life-web — React frontend (pnpm)

```bash
cd life-web
pnpm install
pnpm dev       # Vite dev server (port 5173)
pnpm test      # vitest (jsdom)
pnpm build     # tsc -b + vite build → dist/
pnpm typecheck # tsc --noEmit
```

Variable clé : `VITE_API_URL` (défaut : `https://api.saillant.cc`). Passée comme build arg Docker. Le client API principal est `src/lib/api.ts`.

### life-core — FastAPI LLM router (Python ≥3.12)

```bash
cd life-core
source .venv/bin/activate
PYTHONPATH=$PWD:$PYTHONPATH pytest tests/ -v      # tous les tests
PYTHONPATH=$PWD:$PYTHONPATH pytest tests/test_router.py -v  # un seul fichier
uvicorn life_core.api:app --reload                # port 8000
```

### makelife-cad — CAD/EDA gateway (Python FastAPI)

```bash
cd makelife-cad
source .venv/bin/activate
PYTHONPATH=$PWD:$PYTHONPATH pytest tests/ -v
uvicorn gateway.app:app --reload --port 8001
```

### finefab-shared — contrats partagés

```bash
cd finefab-shared
python scripts/generate_types.py   # valider schémas + régénérer types
```

Code généré à ne jamais modifier à la main :
- `life-reborn/src/generated/*` → `cd life-reborn && npm run openapi:generate && npm run client:generate`
- `finefab-shared/python/` et `finefab-shared/typescript/` → `cd finefab-shared && python scripts/generate_types.py`

## Déploiement production

```bash
cd /home/clems/finefab-life
docker compose \
  --env-file /home/clems/finefab-life/.env \
  --env-file /home/clems/.secrets/saillant-shared.env \
  -f docker-compose.prod.yml up -d --build
```

- `--env-file` passé **deux fois** : `.env` (credentials locaux) + `saillant-shared.env` (secrets Tower partagés, source de vérité = Infisical). Sans `--env-file`, Compose ne charge plus `.env` automatiquement.
- `--build` obligatoire si code modifié.

Rebuild un seul service :
```bash
docker compose --env-file .env --env-file /home/clems/.secrets/saillant-shared.env \
  -f docker-compose.prod.yml up -d --build --force-recreate <service>
```

## Réseaux et proxies

- `life-internal` : communication inter-services (life-core, life-reborn, redis, qdrant, otel-collector, jaeger, langfuse, makelife-cad, forgejo)
- `traefik` : routage public via le Traefik **local** de ce stack (Let's Encrypt, pas celui de photon)
- life-reborn → life-core : `CORE_URL=http://life-core:8000`
- `vllm-kxkm-proxy` (socat) : TCP :11436 → KXKM-AI:8000 (vLLM, mode host)
- `ollama-cils-proxy` (socat) : TCP :11435 → Cils:11434 (Ollama, mode host)
- life-core accède aux LLM via `host.docker.internal:11435` (Ollama) et `host.docker.internal:11436` (vLLM)

## Pièges connus

- **Env vars Vite** : `VITE_*` sont compilées dans le bundle JS au build Docker via `build.args`. Pas d'injection runtime — rebuilder life-web si l'URL API change.
- **Routers Traefik TLS** : chaque router sur l'entrypoint `websecure` **doit** avoir `tls.certresolver=letsencrypt` dans ses labels, sinon il ne matche pas les connexions HTTPS (404).
- **Labels = containers** : les labels Traefik sont attachés aux containers au moment de leur création. Modifier le compose ne suffit pas — il faut `--force-recreate` le service concerné pour que Traefik relise les labels.
- **Containers orphelins** : `docker compose up` peut échouer avec "container name already in use" si un container précédent n'a pas été nettoyé. Fix : `docker rm -f <container>` puis relancer.
- **Healthchecks** : life-core a `start_period: 15s` + `timeout: 20s` car LiteLLM est lent au démarrage. life-reborn dépend de `life-core: service_healthy`.
- **OTEL conditionnel** : les services n'initialisent OTEL que si `OTEL_EXPORTER_OTLP_ENDPOINT` est défini.
- **PYTHONPATH** : life-core nécessite `PYTHONPATH=$PWD:$PYTHONPATH` avant les tests.
- **Submodules** (factory-4-life) : commiter à l'intérieur de chaque submodule, pas depuis la racine.

## Stack technique

| Sous-projet | Langage | Framework | Tests | Package manager |
|-------------|---------|-----------|-------|-----------------|
| life-core | Python 3.12+ | FastAPI, LiteLLM, Qdrant, Redis | pytest (≥80% coverage) | pip |
| life-reborn | TypeScript 5.8 | Hono 4, Zod, @hono/zod-openapi | vitest | npm |
| life-web | TypeScript | React 19, Vite 6, TanStack Router+Query, Tailwind | vitest (jsdom) | pnpm |
| makelife-cad | Python 3.12+ | FastAPI | pytest | pip |
| makelife-firmware | C/C++ | PlatformIO, ESP32/STM32 | Unity | pio |
| finefab-shared | Python + TS | JSON Schema → Pydantic + TS | — | pip + npm |
| KIKI-models-tuning | Python | Unsloth, LoRA | pytest | pip |
