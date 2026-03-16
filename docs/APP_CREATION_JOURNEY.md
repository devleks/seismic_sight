# SeismicSight: App Creation Journey

This document provides a high-level overview of the architectural and feature milestones achieved during the development of SeismicSight.

## Visual Overview

![App Creation Journey](./App_Creation_Journey.png)

## Milestone Breakdown

### Phase 1: The Foundation (v1.0.0)
- **Core Tech Stack:** React, Tailwind CSS.
- **Real-Time AI Vision:** Integrated Gemini Live API via WebSockets for real-time structural hazard detection.
- **Empirical Data:** Integrated the USGS Earthquake Hazards Program API for live seismic data.

### Phase 2: Voice & Simulation (v1.1.0)
- **Voice Commands:** Added hands-free control ("Scan the area", "Simulate an earthquake").
- **Predictive Simulation:** Implemented a side-by-side UI comparing the original environment to the AI-generated disaster aftermath.

### Phase 3: Deployment Prep (v1.2.0)
- **Cloud Run Readiness:** Configured backend environment variables (`/api/config`) for secure API key injection during deployment.

### Phase 4: Token Economics & Security (v1.3.0 - v1.4.0)
- **Architectural Throttling:** Reduced video frame rate from 2fps to 1fps, cutting token costs by 50%.
- **Rate Limiting:** Added 60-second and 30-second cooldowns to expensive AI operations to prevent API abuse.
- **Credential Security:** Implemented a secure, masked React modal for API key entry and obfuscated the key in `sessionStorage`.

### Phase 5: Mobile UX Polish (v1.5.0)
- **Camera Optimization:** Implemented device-specific logic to automatically default to the back (environment) camera on mobile and tablet devices.
- **Camera Switching:** Added a seamless UI toggle for switching between front and back cameras.

### Phase 6: API Key UX & Stability Polish (v1.7.0)
- **Environment Stability:** Fixed a critical Vite environment variable bug that caused silent crashes when the API key was missing from the `.env` file.
- **Frictionless Onboarding:** Implemented a "Pending Action" state. The app now remembers the user's intended action (Connect, Scan, Simulate) before prompting for an API key, and automatically executes it once the key is saved.
