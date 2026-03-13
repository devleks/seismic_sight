# SeismicSight

SeismicSight is an elite Emergency Disaster Guardian application designed to provide real-time structural hazard analysis and predictive disaster simulations. By leveraging advanced AI vision and live seismic data, SeismicSight helps users identify potential risks in their environment and prepare for seismic events.

## Features

- **Real-Time Hazard Detection:** Continuously analyzes your camera feed to identify structural and environmental risks, such as unanchored furniture, exposed gas lines, and large glass panes.
- **Live Hazard Feed:** Displays a chronological log of detected hazards with confidence scores, allowing you to monitor risks as they are identified.
- **Predictive Disaster Simulation:** Generates realistic aftermath photos based on the current room layout and potential seismic magnitudes, helping visualize the impact of an earthquake. Shows a side-by-side comparison of the original room and the simulated aftermath.
- **USGS Data Integration:** Fetches live seismic data from the US Geological Survey (USGS) to provide real-time alerts and safety protocols based on recent global events.
- **Voice Commands:** Control the application hands-free using voice commands. You can ask the AI to scan the room, simulate an earthquake, close the simulation, query the USGS API for specific earthquake data, or stop the live view.
- **Adjustable Confidence Threshold:** Fine-tune the AI's sensitivity to reduce false positives and focus on the most critical hazards.

## Tech Stack

- **Frontend:** React 18, TypeScript, Vite
- **Styling:** Tailwind CSS, Lucide React (Icons)
- **Animations:** Motion (Framer Motion)
- **AI Integration:** `@google/genai` (Gemini 2.5 Flash Native Audio, Gemini 3.1 Flash Image Preview)
- **External APIs:** USGS Earthquake Hazards Program API

## Getting Started

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to the provided local URL.

## Voice Commands

Once the live connection is established, you can use the following voice commands:

- **"Scan the room"**: Initiates a structural hazard scan of the current camera view.
- **"Simulate an earthquake"**: Generates a side-by-side visual simulation of the room after a major earthquake.
- **"Close simulation"**: Closes the aftermath simulation and returns to the live camera feed.
- **"Stop live view" / "Disconnect"**: Closes the live connection, turns off the camera and microphone, and returns to the idle state.
- **Query Earthquakes**: Ask questions like "Where were there earthquakes below magnitude 5 today?" or "Were there any earthquakes above magnitude 7 last week?" to fetch specific data from the USGS API.

## Configuration

To use the AI features, you will need a valid Google Gemini API key. The application supports multiple ways to configure this:

1. **Environment Variable (Recommended for Deployment):** Set the `GEMINI_API_KEY` or `API_KEY` environment variable in your deployment environment (e.g., Google Cloud Run). The backend will securely provide this to the frontend.
2. **AI Studio Interface:** If running within Google AI Studio, the application will automatically use the platform's key selector.
3. **Manual Entry:** If no key is found, the application will prompt you to manually enter your Gemini API key, which will be securely stored in your browser's session storage for the duration of your visit.

## Architecture

For a detailed breakdown of the system architecture and data flow, please see the [Architecture Diagram](ARCHITECTURE.md).

### Architecture Drawings

The following architecture drawings were generated using **Nano Banana 2** (Gemini 3.1 Flash Image Preview):

- **Architecture Overview**  
  ![Architecture Overview](Architecture%20Overview.png)

- **Architecture Workflow**  
  ![Architecture Workflow](Architecture%20workflow.png)

- **AI Architecture Overview**  
  ![AI Architecture Overview](AI%20Architecture%20Overview.png)

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [CHANGELOG.md](CHANGELOG.md).

## Disclaimer

**PREDICTIVE SIMULATION: NOT A REAL-TIME EVENT.**
This AI analysis is for simulation and training purposes. In a real seismic event, follow local authority guidelines and established evacuation protocols immediately.
