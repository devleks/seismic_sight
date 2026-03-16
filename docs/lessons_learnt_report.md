# Lessons Learnt Report

**Project:** SeismicSight
**Date:** March 16, 2026

## 1. What Went Well
* **Keyless Public APIs:** Relying on the USGS Earthquake API was a massive win. Because it doesn't require an API key, we eliminated a huge point of failure for users testing the app.
* **Multimodal AI:** Combining Gemini Live (Voice) with Gemini Pro (Vision) allowed us to create a truly immersive "Emergency Assistant" that feels alive and aware of its surroundings.
* **Session Storage for Security:** Storing the user's Gemini API key in `sessionStorage` provided the perfect balance between security (it clears when the tab closes) and UX (they don't have to enter it on every refresh).

## 2. Technical Challenges & Solutions
* **Audio Buffer Management:** 
  * *Challenge:* Streaming raw PCM audio from the Gemini Live API directly into the browser's `AudioContext` caused overlapping audio if the AI was interrupted.
  * *Solution:* Implemented an `activeSourcesRef` array to track currently playing audio nodes. When the user interrupts the AI (or clicks cancel), we iterate through the array and call `.stop()` on all active buffers, instantly silencing the AI.
* **WebSocket Race Conditions:**
  * *Challenge:* React state updates (`useState`) are asynchronous, which caused issues when trying to send data to the Gemini Live WebSocket immediately after a state change.
  * *Solution:* Relied heavily on `useRef` for mutable values that needed to be accessed instantly inside WebSocket callbacks (e.g., `abortControllerRef`, `sessionRef`, `isScanningRef`).
* **Rate Limiting AI Vision:**
  * *Challenge:* Users spamming the "Scan" or "Simulate" buttons could quickly exhaust their Gemini API quota.
  * *Solution:* Implemented a strict timestamp-based cooldown mechanism (`SCAN_COOLDOWN_MS` and `SIMULATE_COOLDOWN_MS`) that blocks rapid-fire requests and provides user feedback.

## 3. Future Improvements
* **WebRTC Integration:** Currently, video frames are sent as base64 JPEGs at 1fps. Moving to a true WebRTC stream would reduce latency and bandwidth.
* **Push Notifications:** Integrating Firebase Cloud Messaging (FCM) to send push alerts to users when a critical earthquake occurs near their geolocation.
* **Offline Mode:** Caching recent USGS data and emergency protocols using Service Workers so the app remains partially functional if cell towers go down during a disaster.
