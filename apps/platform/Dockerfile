FROM node:20-alpine AS builder
WORKDIR /app
RUN npm install -g pnpm
COPY package.json pnpm-workspace.yaml ./
COPY apps/platform/package.json ./apps/platform/
RUN pnpm install --filter @vaultguard/platform --ignore-scripts
COPY apps/platform ./apps/platform/
ARG VITE_API_URL
ARG VITE_AUTH0_DOMAIN
ARG VITE_AUTH0_CLIENT_ID
ARG VITE_AUTH0_REDIRECT_URI
WORKDIR /app/apps/platform
RUN echo "VITE_API_URL=$VITE_API_URL" > .env && \
    echo "VITE_AUTH0_DOMAIN=$VITE_AUTH0_DOMAIN" >> .env && \
    echo "VITE_AUTH0_CLIENT_ID=$VITE_AUTH0_CLIENT_ID" >> .env && \
    echo "VITE_AUTH0_REDIRECT_URI=$VITE_AUTH0_REDIRECT_URI" >> .env
RUN pnpm build

FROM nginx:alpine
COPY --from=builder /app/apps/platform/dist /usr/share/nginx/html
COPY apps/platform/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
