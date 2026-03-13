# Architecture Diagram

This document outlines the high-level architecture of SeismicSight, illustrating how the frontend, backend, and external services interact.

## System Architecture

```mermaid
graph TD
    %% Define Styles
    classDef frontend fill:#E3F2FD,stroke:#1E88E5,stroke-width:2px;
    classDef backend fill:#E8F5E9,stroke:#43A047,stroke-width:2px;
    classDef external fill:#FFF3E0,stroke:#FB8C00,stroke-width:2px;
    classDef user fill:#F3E5F5,stroke:#8E24AA,stroke-width:2px;

    %% Components
    User((User)):::user

    subgraph Client [Frontend - React SPA]
        UI[User Interface / React]:::frontend
        Media[Camera & Microphone]:::frontend
        GenAI[Google GenAI SDK]:::frontend
    end

    subgraph Server [Backend - Node.js / Express]
        Static[Static File Server]:::backend
        ConfigAPI[/api/config Endpoint]:::backend
    end

    subgraph External [External Services]
        Gemini[Google Gemini API]:::external
        USGS[USGS Earthquake API]:::external
    end

    %% Connections
    User -->|Interacts| UI
    User -->|Provides Video/Audio| Media
    
    UI -->|Requests App Files| Static
    UI -->|Fetches API Key| ConfigAPI
    
    Media -->|Streams Media| GenAI
    
    GenAI <-->|WebSocket (Live API) / REST (Images)| Gemini
    GenAI <-->|Tool Execution (Fetch Data)| USGS
    
    %% Tool Execution Loop
    Gemini -.->|Function Call Request| GenAI
    GenAI -.->|Function Response| Gemini
```

## Component Breakdown

### 1. Frontend (Client)
- **React SPA**: Built with React, Vite, and Tailwind CSS. It manages the user interface, state, and handles user interactions.
- **Media (Camera & Microphone)**: Uses the browser's `getUserMedia` API to capture real-time video and audio for hazard analysis.
- **Google GenAI SDK**: The official `@google/genai` library running in the browser. It handles the WebSocket connection for Gemini Live (real-time audio/video streaming) and REST calls for image generation (predictive simulation).

### 2. Backend (Server)
- **Express.js Server**: A lightweight Node.js server (`server.js`).
- **Static File Server**: Serves the compiled React frontend (`dist` folder) to the client.
- **`/api/config` Endpoint**: Securely exposes the `GEMINI_API_KEY` environment variable to the frontend, ensuring the key doesn't need to be hardcoded or baked into the build.

### 3. External Services
- **Google Gemini API**: 
  - **Gemini 2.5 Flash Native Audio**: Powers the real-time conversational AI and video analysis via the Live API WebSocket.
  - **Gemini 3.1 Pro Preview**: Powers the predictive disaster simulation (image-to-image generation).
- **USGS Earthquake API**: The US Geological Survey API is queried by the frontend (triggered by Gemini tool calls) to fetch real-time and historical global seismic data.

## Data Flow

1. **Initialization**: The user navigates to the app. The Express server serves the React SPA.
2. **Configuration**: The React app fetches the Gemini API key from the `/api/config` endpoint.
3. **Connection**: The app requests camera/microphone permissions and establishes a WebSocket connection to the Gemini Live API.
4. **Real-Time Analysis**: Audio and video frames are streamed to Gemini. Gemini responds with audio (voice) and text (hazard logs).
5. **Tool Execution**: If the user asks about earthquakes, Gemini sends a `functionCall` to the client. The client queries the **USGS API**, and sends the `functionResponse` back to Gemini, which then narrates the findings to the user.
6. **Simulation**: When requested, the client captures a high-resolution frame from the video feed and sends it to the Gemini REST API to generate a simulated aftermath image.
