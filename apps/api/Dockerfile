FROM node:20-alpine
WORKDIR /app
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
