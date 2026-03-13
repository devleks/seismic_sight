# Stage 1: Build the Vite Frontend
FROM node:20-alpine AS builder

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
FROM node:20-alpine AS runner

WORKDIR /app

# Copy production dependencies only to keep the image slim
COPY package*.json ./
RUN npm install --omit=dev

# Copy the built frontend from the builder stage
COPY --from=builder /app/dist ./dist

# Copy your server-side code (Express/Node)
# Ensure this matches your actual server filename (e.g., server.js)
COPY . .

# Use a non-root user for security
USER node

EXPOSE 8080
ENV PORT 8080
ENV NODE_ENV=production

# Start your Express server, NOT the vite-dist folder directly
# Adjust "server.js" if your entry file has a different name
CMD ["node", "server.js"]