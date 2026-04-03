FROM node:20-slim
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm tsx
COPY package.json ./
COPY pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN pnpm install --filter @vaultguard/api --ignore-scripts
COPY apps/api ./apps/api/
WORKDIR /app/apps/api
RUN npx prisma generate
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && tsx src/index.ts"]
