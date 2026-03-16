# SeismicSight: Devpost Submission Story

## Inspiration

Current disaster alerts are "location-aware" but not "spatial-aware." While a phone can tell you a 6.5 magnitude quake is happening 20 miles away, it can't tell you that the unanchored bookshelf behind you is a lethal hazard, or that the tree outside your window is unstable. I wanted to create an agent that doesn't just send a notification but actually **occupies the environment with you**, helping you see and mitigate risks before the first tremor hits using real-time voice and vision.

## What it does

**SeismicSight** is a multimodal, voice-activated "Emergency Guardian" that uses your camera and microphone to identify structural risks in real-time.

* **Conversational AI:** Powered by the Gemini Live API, you can talk to the assistant hands-free (e.g., "Scan the area," "Were there any earthquakes today?").
* **Hazard Detection:** It visually analyzes your surroundings (indoors or outdoors) to flag unanchored furniture, tripping hazards, or exterior risks like power lines.
* **Live Grounding:** It fetches real-time seismic data from the USGS API to answer questions about global earthquake activity.
* **Predictive Simulation:** On command, it generates a side-by-side "Aftermath Photo" of your exact environment, showing realistic damage based on the current layout. This provides a visceral, localized understanding of risk that a text alert never could.

## How we built it

We leveraged the full power of the `@google/genai` SDK and the latest Gemini models to create a truly multimodal experience:

* **The Conversational Core:** **Gemini 2.5 Flash Native Audio** drives the real-time WebRTC voice interface, allowing seamless, low-latency spoken interactions and dynamic tool calling.
* **The Analytical Eye:** **Gemini 3.1 Pro Preview** handles the complex multimodal reasoning for hazard identification, processing camera frames to locate and describe risks.
* **The Visual Engine:** **Gemini 3.1 Flash Image Preview** powers the predictive simulation, rendering structurally accurate disaster aftermaths while maintaining the architectural integrity of the user's environment.
* **Data Integration:** We built custom tool integrations for the **USGS Earthquake API** to ground the agent's knowledge in real-time geological data.
* **Frontend:** The application is built with React, Vite, and Tailwind CSS, utilizing a custom WebRTC audio pipeline.

## Challenges we ran into

* **Orchestrating Multiple Models:** The biggest challenge was seamlessly connecting the WebRTC audio stream (Gemini 2.5 Flash Native Audio) with the heavy-lifting vision and image generation tasks. We had to build a robust tool-calling architecture where the audio model could trigger background processes (like `scan_environment` or `simulate_aftermath`) without dropping the live voice connection.
* **Latency vs. Quality:** Balancing the need for high-quality visual analysis with the expectation of a snappy, conversational agent. We optimized this by having the audio agent provide immediate verbal feedback ("I am scanning the environment now...") while the heavier Gemini 3.1 Pro model processed the image asynchronously.

## Accomplishments that we're proud of

* **The "Visual-Verbal Loop":** Successfully choreographing the agent to narrate its actions and findings while coordinating complex image generation and analysis in the background.
* **True Multimodality:** Combining native audio, high-resolution image understanding, and image generation into a single, cohesive user experience.
* **Dynamic Tool Calling:** Enabling the Live API agent to dynamically query the USGS database based on natural language questions and summarize the JSON results verbally.

## What we learned

Building SeismicSight taught us the immense potential of the Gemini Live API for hands-free, high-stress scenarios. We learned that in emergency tech, **speed and natural interaction are features.** We also discovered the power of using specialized models for specific tasks (Native Audio for conversation, 3.1 Pro for analysis, 3.1 Flash Image for generation) rather than trying to force one model to do everything.

## What's next for SeismicSight

* **Veo 3.1 Integration:** Adding a "High-Impact" mode that generates short video simulations of the shaking, rather than just static aftermath photos.
* **AR Overlay:** Using AR to project the safest "Green Path" evacuation route directly onto the user's floor in the camera view.
* **Multi-Device Sync:** Allowing a "Home Hub" and a "Mobile Device" to share a single SeismicSight state, providing a coordinated family response plan.
