# 1) Install dependencies in a build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .

# 2) Production image
FROM node:22-alpine AS runtime
WORKDIR /app
# Copy only the compiled app + prod deps
COPY --from=builder /app ./
# Run as non-root
USER node
EXPOSE 3000
CMD ["node", "server.js"]