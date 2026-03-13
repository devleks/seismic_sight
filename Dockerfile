# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only dependency files first to leverage Docker cache
# If these files don't change, Docker skips 'npm ci' in future builds
COPY package*.json ./

# RUN npm ci requires package-lock.json to exist in the same directory
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the app (if applicable, e.g., for TypeScript or React)
RUN npm run build

# Stage 2: Production
FROM node:20-alpine AS runner

WORKDIR /app

# Only copy necessary files from the builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist 
# Note: Adjust './dist' to your actual build output folder (e.g., './build' or './.next')

# Use a non-root user for better security in Cloud Run
USER node

EXPOSE 8080
ENV PORT 8080

# Start the application directly with node (best practice for signals)
CMD ["node", "dist/index.js"]
