# Lightweight goosed server from prebuilt Goose binary
# The goose-server crate produces a binary named 'goosed'
# Run with: goosed agent  (binds GOOSE_HOST / GOOSE_PORT, default 0.0.0.0:3000)
FROM debian:bookworm-slim

ARG GOOSE_VERSION=v1.29.1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates curl git bzip2 libssl3 libdbus-1-3 \
    && rm -rf /var/lib/apt/lists/*

# Download prebuilt binary (x86_64 Linux) — tarball contains 'goose'
RUN curl -fsSL "https://github.com/block/goose/releases/download/${GOOSE_VERSION}/goose-x86_64-unknown-linux-gnu.tar.bz2" \
    | tar xj --strip-components=0 -C /usr/local/bin/ \
    && chmod +x /usr/local/bin/goose

RUN useradd -m -u 1000 goose
USER goose
WORKDIR /home/goose

RUN mkdir -p .config/goose

COPY --chown=goose:goose config.yaml .config/goose/config.yaml
COPY --chown=goose:goose entrypoint.sh /entrypoint.sh

# goosed agent binds on GOOSE_HOST:GOOSE_PORT (default 127.0.0.1:3000)
# We override both via env in entrypoint / docker-compose
EXPOSE 3000

ENTRYPOINT ["/bin/bash", "/entrypoint.sh"]
