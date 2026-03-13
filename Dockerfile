# Stage 1: Build the Vite Frontend
FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency files
COPY package*.json ./

# Install all dependencies (including devDeps for the build)
# RUN npm install
RUN npm ci

# Copy the rest of the application code
COPY . .

# Run the Vite build to generate the /dist folder
RUN npm run build

# Stage 2: Production Runtime
FROM node:20-slim AS runner

WORKDIR /app

# Copy production dependencies only to keep the image slim
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Copy ONLY your server-side code to prevent overwriting node_modules
# if .dockerignore is accidentally bypassed during upload
COPY server.js ./

# Use a non-root user for security
USER node

EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Start your Express server
CMD ["node", "server.js"]