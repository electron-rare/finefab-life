FROM node:22-alpine AS build
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml* ./
COPY finefab-ui/ ./finefab-ui/
RUN sed -i 's|file:[^"]*finefab-ui[^"]*|file:./finefab-ui|' package.json && pnpm install
COPY . .
RUN sed -i 's|../finefab-ui/src|./finefab-ui/src|g' tailwind.config.ts 2>/dev/null
ARG VITE_API_URL=https://api.saillant.cc
ARG VITE_CAD_URL=https://api.saillant.cc/eda
ARG VITE_KEYCLOAK_URL=https://auth.saillant.cc
ARG VITE_KEYCLOAK_REALM=electro_life
ARG VITE_KEYCLOAK_CLIENT_ID=eda-web
RUN pnpm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
