#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "${script_dir}/.." && pwd)
local_env="${repo_root}/.env"
shared_env="/home/clems/.secrets/saillant-shared.env"
compose_file="${repo_root}/docker-compose.prod.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker is required" >&2
  exit 1
fi

if [[ ! -f "${local_env}" ]]; then
  echo "missing env file: ${local_env}" >&2
  exit 1
fi

if [[ ! -f "${shared_env}" ]]; then
  echo "missing env file: ${shared_env}" >&2
  exit 1
fi

compose_cmd=(
  docker compose
  --env-file "${local_env}"
  --env-file "${shared_env}"
  -f "${compose_file}"
)

(
  cd "${repo_root}"
  "${compose_cmd[@]}" config --quiet
)

up_args=(up -d --build)
bootstrap_keycloak=0
if [[ $# -gt 0 ]]; then
  up_args+=(--force-recreate "$@")
  for service_name in "$@"; do
    case "${service_name}" in
      keycloak|keycloak-postgres)
        bootstrap_keycloak=1
        ;;
    esac
  done
else
  bootstrap_keycloak=1
fi

cd "${repo_root}"
"${compose_cmd[@]}" "${up_args[@]}"

if (( bootstrap_keycloak )); then
  bash "${script_dir}/bootstrap_keycloak_local.sh"
fi
