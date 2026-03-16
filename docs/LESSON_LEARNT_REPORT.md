# Lessons Learnt Report

**Project:** SeismicSight
**Date:** March 16, 2026
**Scope:** Retrospective covering the entire development lifecycle.

## 1. What Went Well (The Wins)
* **Keyless Public APIs:** Relying on the USGS Earthquake API was a massive win from the very beginning. Because it doesn't require an API key or authentication, we eliminated a huge point of failure for users and judges testing the app.
* **Multimodal AI Synergy:** Combining Gemini Live (Voice) with Gemini Pro (Vision) and Gemini Flash (Image Generation) allowed us to create a truly immersive "Emergency Assistant" that feels alive, aware of its surroundings, and capable of complex visual tasks.
* **Session Storage for Security:** Storing the user's Gemini API key in `sessionStorage` provided the perfect balance between security (it clears when the tab closes) and UX (they don't have to enter it on every refresh).
* **React Component Model:** React's component-based architecture made it easy to isolate complex UI elements (like the camera feed and the hazard dashboard) while managing global state at the top level.

## 2. Technical Challenges & Solutions
* **Audio Buffer Management (Gemini Live):** 
  * *Challenge:* Streaming raw PCM audio from the Gemini Live API directly into the browser's `AudioContext` caused overlapping audio if the AI was interrupted or if network latency caused chunks to arrive out of order.
  * *Solution:* Implemented an `activeSourcesRef` array to track currently playing audio nodes. When the user interrupts the AI (or clicks cancel), we iterate through the array and call `.stop()` on all active buffers, instantly silencing the AI and resetting the playback queue.
* **WebSocket Race Conditions:**
  * *Challenge:* React state updates (`useState`) are asynchronous, which caused issues when trying to send data to the Gemini Live WebSocket immediately after a state change (e.g., trying to send a tool response before the state fully updated).
  * *Solution:* Relied heavily on `useRef` for mutable values that needed to be accessed instantly inside WebSocket callbacks (e.g., `abortControllerRef`, `sessionRef`, `isScanningRef`).
* **Prompt Engineering for Bounding Boxes:**
  * *Challenge:* Getting the Vision model to consistently return accurate X/Y coordinates for hazards in the image.
  * *Solution:* Instructed the model to return coordinates as percentages (0-100) rather than absolute pixels, making the bounding boxes responsive to any screen size or aspect ratio.
* **Rate Limiting AI Vision:**
  * *Challenge:* Users spamming the "Scan" or "Simulate" buttons could quickly exhaust their Gemini API quota or cause the app to freeze while waiting for massive base64 image payloads.
  * *Solution:* Implemented a strict timestamp-based cooldown mechanism (`SCAN_COOLDOWN_MS` and `SIMULATE_COOLDOWN_MS`) that blocks rapid-fire requests and provides immediate user feedback via toast notifications.

## 3. Future Improvements
* **WebRTC Integration:** Currently, video frames are sent as base64 JPEGs at 1fps. Moving to a true WebRTC stream would reduce latency, lower bandwidth usage, and provide a smoother live-video experience for the AI.
* **Push Notifications:** Integrating Firebase Cloud Messaging (FCM) to send push alerts to users when a critical earthquake occurs near their geolocation.
* **Offline Mode:** Caching recent USGS data and emergency protocols using Service Workers so the app remains partially functional if cell towers go down during a disaster.
* **Native Mobile App:** Porting the React codebase to React Native to access native camera APIs, hardware acceleration, and background location services for more robust emergency monitoring.
