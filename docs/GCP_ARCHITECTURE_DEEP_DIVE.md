# Advanced GCP Architecture Deep Dive: SeismicSight

This document explores the transition of SeismicSight from a client-side prototype to a production-grade, event-driven cloud architecture using Google Cloud Platform (GCP). 

As a Senior Architect, your goal is to decouple the frontend from direct third-party API dependencies, secure your credentials, and build a system capable of handling 10,000+ concurrent users during a seismic event without hitting rate limits.

---

## Phase 1: The Backend-for-Frontend (BFF) on Cloud Run

Currently, your React client makes direct calls to the Gemini API and USGS API. This exposes your API keys and relies on the client's network for heavy lifting.

**The Solution:** Introduce an Express.js Node server deployed on **Google Cloud Run**.

### Architectural Flow:
1. **Client:** Sends 1fps video frames (base64) and audio via WebSockets to your Cloud Run server.
2. **Cloud Run (BFF):** 
   - Securely retrieves the `GEMINI_API_KEY` from **Google Cloud Secret Manager** at startup.
   - Maintains the stateful WebSocket connection with the Gemini Live API.
   - Processes the AI response and sends a lightweight JSON payload back to the client.
3. **Vite Integration:** During development, the Express server uses Vite as middleware. In production, it serves the static `dist/` folder.

### Code Pattern (Express + Vite + WebSockets):
```typescript
// server.ts (Conceptual Scaffold)
import express from 'express';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// 1. Secure API Routes
app.get('/api/earthquakes', async (req, res) => {
  // Fetch from USGS, potentially utilizing a Redis cache here
});

// 2. WebSocket Handling for Gemini Live
wss.on('connection', (ws) => {
  console.log('Client connected for real-time analysis');
  
  // Initialize secure connection to Gemini Live API here
  // using credentials from Secret Manager (process.env.GEMINI_API_KEY)

  ws.on('message', (message) => {
    // Receive 1fps video frame from client
    // Forward to Gemini API
  });
});

// 3. Vite Middleware (Development) or Static Serving (Production)
// ... (Standard Vite setup)

server.listen(3000, '0.0.0.0', () => {
  console.log('Cloud Run BFF listening on port 3000');
});
```

---

## Phase 2: Event-Driven Alerts with Pub/Sub & Cloud Scheduler

Relying on the client to constantly poll the USGS API for new earthquakes is inefficient and drains mobile batteries. We need a push-based model.

**The Solution:** An event-driven architecture using **Cloud Scheduler**, **Pub/Sub**, and **WebSockets**.

### Architectural Flow:
1. **Cloud Scheduler:** Acts as a cron job. Every 1 minute, it triggers a lightweight Cloud Function.
2. **Cloud Function (The Producer):** 
   - Fetches the latest data from the USGS API.
   - Compares it against the last known state (stored in Firestore or Redis).
   - If a *new* significant earthquake (e.g., Magnitude > 5.0) is detected, it publishes a message to a **Pub/Sub Topic** (e.g., `projects/my-project/topics/seismic-alerts`).
3. **Cloud Run BFF (The Consumer):** 
   - Subscribes to the Pub/Sub topic. 
   - When a message arrives, the BFF iterates through all currently connected WebSocket clients and pushes the alert instantly.

### Why this is Senior-Level Architecture:
- **Decoupling:** The system fetching the earthquake data is completely separated from the system serving the users. If USGS goes down, your Cloud Run server doesn't crash; it just stops receiving Pub/Sub messages.
- **Fan-out Scalability:** Pub/Sub can fan out a single earthquake event to dozens of Cloud Run instances simultaneously, which then push to thousands of connected clients in milliseconds.

---

## Phase 3: High-Concurrency Caching with Memorystore (Redis)

If a major earthquake hits, you might experience a "thundering herd" problem where thousands of users open SeismicSight simultaneously. If your Cloud Run server fetches from USGS for every user, USGS will rate-limit and block your IP.

**The Solution:** Implement **Google Cloud Memorystore (Redis)** as a caching layer.

### Architectural Flow:
1. User requests `/api/earthquakes`.
2. Cloud Run checks Redis: `GET usgs_latest_data`.
3. **Cache Hit:** Return data from Redis (latency: ~2ms).
4. **Cache Miss:** Fetch from USGS (latency: ~800ms), store in Redis with a Time-To-Live (TTL) of 60 seconds (`SETEX usgs_latest_data 60 [data]`), and return to user.

### The Result:
Even if 10,000 users request the data in the same second, only *one* request actually hits the USGS API. The other 9,999 are served instantly from Redis memory.

---

## Next Steps: Execution

As an Agentic Architect, you don't need to write this boilerplate manually. We can execute this transition iteratively. 

**Which phase would you like to implement first?**
1. **Convert to Full-Stack:** I can refactor your current Vite SPA into an Express + Vite full-stack app (`server.ts`) to prepare for Cloud Run and secure your API keys.
2. **Scaffold Pub/Sub:** I can write the Google Cloud Function and Pub/Sub integration scripts for the event-driven alert system.
3. **Implement Redis Caching:** I can add the Redis caching layer to your existing data fetching logic.
