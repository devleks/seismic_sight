# SeismicSight - Demo Video Script (Judges & Users)

**Target Duration:** ~4 Minutes
**Target Audience:** Hackathon Judges (Technical) & Casual Users (Non-Technical)
**Tone:** Professional, informative, technically sound, yet accessible and reassuring.
**Visuals:** Screen recordings of the SeismicSight application running on both desktop and mobile devices.

---

## 0:00 - 0:45 | Introduction & The Problem
**Visual:** Title card: "SeismicSight: AI-Powered Disaster Preparedness." Cut to a wide shot of the SeismicSight dashboard showing the live camera feed and USGS data panel.
**Audio (Narrator):**
"Welcome to SeismicSight. When an earthquake strikes, seconds matter, but preparation saves lives. Most people don't realize the hidden dangers in their own homes until it's too late. 
SeismicSight bridges this gap. It's an intelligent, real-time disaster preparedness tool that uses advanced AI vision and live seismic data to analyze your environment. Whether you're a homeowner looking to secure your living space, or outside evaluating the safety of a building facade, SeismicSight demonstrates how multimodal AI can solve real-world safety challenges."

## 0:45 - 1:30 | Multimodal AI & Open-Ended Hazard Detection
**Visual:** Switch to a mobile device view. The user pans around an environment (indoors or outdoors). The user taps the "Scan" button. The "Live Hazard Feed" populates with identified risks (e.g., unanchored bookshelf, tripping hazard, blocked exit, or unstable trees).
**Audio (Narrator):**
"Let's look at our core feature: Real-Time Hazard Detection. Under the hood, we leverage the Gemini 3.1 Flash model for rapid, high-accuracy image analysis. 
But we don't just look for a hardcoded list of items. Our AI freely determines and categorizes any potential safety, structural, or environmental risks—from unanchored furniture to tripping hazards and electrical issues. It processes the video frame, identifies the coordinates of each hazard, and returns a structured JSON response. For the user, this translates to a simple, intuitive checklist of what needs fixing, complete with a Structural Integrity score."

## 1:30 - 2:15 | Voice Commands & Live USGS Data Integration
**Visual:** The user clicks the microphone icon. Text appears on screen showing the voice command: "Where were there earthquakes above magnitude 5 today?" The left panel updates with live USGS data.
**Audio (Narrator):**
"In an emergency or while inspecting an area, hands-free operation is crucial. We integrated the Gemini 2.5 Flash Native Audio model to create a truly conversational interface via WebRTC. 
You can simply ask the AI to 'Scan the area' or 'Simulate an earthquake.' But it goes further: SeismicSight integrates directly with the US Geological Survey (USGS) API. You can ask complex questions like, 'Were there any earthquakes above magnitude 5 today?' The AI acts as an intelligent agent, querying the live USGS database, parsing the geospatial data, and speaking the results back to you while updating the dashboard."

## 2:15 - 3:15 | Predictive Disaster Simulation (Generative AI)
**Visual:** The user says "Simulate an earthquake." The screen transitions to a side-by-side comparison. The left side shows the original environment; the right side shows a highly realistic, AI-generated aftermath of the area post-earthquake (e.g., fallen books, cracked walls, or downed power lines).
**Audio (Narrator):**
"To truly drive home the importance of preparation, we built the Predictive Disaster Simulation. Using Gemini's advanced image generation capabilities, we take the current frame of your environment and prompt the model to generate a realistic, cinematic aftermath of a major seismic event. 
Technically, this involves sending the base64 encoded image with a highly specific prompt to maintain the environment's geometry while applying disaster aesthetics. For the user, this visceral, side-by-side comparison shows exactly what could happen if that heavy bookshelf isn't anchored to the wall, or if that unstable tree falls."

## 3:15 - 4:00 | Architecture, Security, & Outro
**Visual:** Briefly show the API key entry modal (masked). Then show a quick diagram of the architecture (React/Vite frontend communicating with Gemini API). Fade to the Devpost challenge graphic.
**Audio (Narrator):**
"From a technical standpoint, SeismicSight is a fully client-side React application. We prioritize user privacy and security: API keys are obfuscated and stored only in session memory, and video feeds are processed locally before sending single frames to the API, minimizing bandwidth and token costs.
SeismicSight is proudly open-source. We built this project to showcase the incredible potential of the Gemini Live API for the Gemini Live Agent Challenge on Devpost. 
Prepare today, protect tomorrow. Thank you for watching."

---
**End of Script**
