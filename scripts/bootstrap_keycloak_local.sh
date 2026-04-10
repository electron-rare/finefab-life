#!/usr/bin/env bash

set -euo pipefail

script_dir=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
repo_root=$(cd -- "${script_dir}/.." && pwd)
local_env="${repo_root}/.env"
shared_env="/home/clems/.secrets/saillant-shared.env"
compose_file="${repo_root}/docker-compose.prod.yml"
suite_repo="${KEYCLOAK_SOURCE_REPO:-/home/clems/suite-numerique}"
suite_scripts_dir="${suite_repo}/scripts"
users_csv="${KEYCLOAK_USERS_CSV:-${suite_repo}/keycloak/electron_rare-users.csv}"

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

required_suite_scripts=(
  configure_keycloak_smtp_live.sh
  harden_keycloak_realms_live.sh
  provision_keycloak_users.sh
  sync_broker_realms_live.sh
  sync_electron_rare_clients_live.sh
  sync_electro_suite_clients_live.sh
  verify_broker_realms_live.sh
)

for script_name in "${required_suite_scripts[@]}"; do
  if [[ ! -f "${suite_scripts_dir}/${script_name}" ]]; then
    echo "missing Keycloak helper: ${suite_scripts_dir}/${script_name}" >&2
    exit 1
  fi
done

if [[ ! -f "${users_csv}" ]]; then
  echo "missing Keycloak users CSV: ${users_csv}" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "${local_env}"
# shellcheck disable=SC1090
source "${shared_env}"
set +a

compose_cmd=(
  docker compose
  --env-file "${local_env}"
  --env-file "${shared_env}"
  -f "${compose_file}"
)

cd "${repo_root}"
keycloak_container_id="$("${compose_cmd[@]}" ps -q keycloak)"
if [[ -z "${keycloak_container_id}" ]]; then
  echo "keycloak service is not running; deploy it first" >&2
  exit 1
fi

admin_user="${KEYCLOAK_ADMIN_USERNAME:-${KC_BOOTSTRAP_ADMIN_USERNAME:-${KEYCLOAK_ADMIN:-admin}}}"
admin_password="${KEYCLOAK_ADMIN_PASSWORD:-${KC_BOOTSTRAP_ADMIN_PASSWORD:-}}"
if [[ -z "${admin_password}" ]]; then
  echo "missing KEYCLOAK_ADMIN_PASSWORD or KC_BOOTSTRAP_ADMIN_PASSWORD" >&2
  exit 1
fi

wait_for_keycloak() {
  local attempts=60
  local sleep_seconds=2
  local status=""

  for ((i = 0; i < attempts; i++)); do
    status="$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "${keycloak_container_id}" 2>/dev/null || true)"
    if [[ "${status}" == "healthy" ]]; then
      return 0
    fi
    sleep "${sleep_seconds}"
  done

  echo "keycloak did not become healthy (last status: ${status})" >&2
  exit 1
}

run_suite_script() {
  local script_name="$1"
  shift

  env \
    KEYCLOAK_CONTAINER="${keycloak_container_id}" \
    KEYCLOAK_ADMIN_USERNAME="${admin_user}" \
    KEYCLOAK_ADMIN_USER="${admin_user}" \
    KEYCLOAK_ADMIN_PASSWORD="${admin_password}" \
    KC_BOOTSTRAP_ADMIN_PASSWORD="${admin_password}" \
    bash "${suite_scripts_dir}/${script_name}" "$@"
}

wait_for_keycloak

run_suite_script sync_electron_rare_clients_live.sh --yes
run_suite_script sync_electro_suite_clients_live.sh --yes
run_suite_script sync_broker_realms_live.sh --yes
run_suite_script configure_keycloak_smtp_live.sh --yes
run_suite_script harden_keycloak_realms_live.sh --yes
run_suite_script provision_keycloak_users.sh --csv "${users_csv}" --realm electron_rare --create-missing-groups --yes
run_suite_script verify_broker_realms_live.sh --json >/dev/null

echo "local finefab-life Keycloak bootstrap completed"
