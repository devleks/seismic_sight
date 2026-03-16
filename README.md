# SeismicSight

SeismicSight is an elite Emergency Disaster Guardian application designed to provide real-time structural hazard analysis and predictive disaster simulations. By leveraging advanced AI vision and live seismic data, SeismicSight helps users identify potential risks in their environment and prepare for seismic events.

## Features

- **Real-Time Hazard Detection:** Continuously analyzes your camera feed to identify any potential safety, structural, or environmental risks, such as unanchored furniture, tripping hazards, electrical issues, and blocked exits. The AI freely determines and categorizes hazards without being restricted to a predefined list.
- **Live Hazard Feed:** Displays a chronological log of detected hazards with confidence scores, allowing you to monitor risks as they are identified.
- **Predictive Disaster Simulation:** Generates realistic aftermath photos based on the current environment layout and potential seismic magnitudes, helping visualize the impact of an earthquake. Shows a side-by-side comparison of the original environment and the simulated aftermath.
- **USGS Data Integration:** Fetches live seismic data from the US Geological Survey (USGS) to provide real-time alerts and safety protocols based on recent global events.
- **Voice Commands:** Control the application hands-free using voice commands. You can ask the AI to scan the area, simulate an earthquake, close the simulation, query the USGS API for specific earthquake data, or stop the live view.
- **Responsive Design:** Fully optimized layout for mobile (360x800px), tablet (768x1024px), and desktop screens, ensuring a seamless experience across all devices.
- **Camera Switching:** Seamlessly switch between front and back cameras on mobile and tablet devices. The app intelligently defaults to the back camera for optimal hazard scanning.
- **Adjustable Confidence Threshold:** Fine-tune the AI's sensitivity to reduce false positives and focus on the most critical hazards.
- **Secure API Key Management:** Enter your Gemini API key via a secure, masked modal dialog. The key is obfuscated in the browser's session storage to protect against shoulder-surfing and casual inspection.
- **Cost-Optimized AI Integration:** Built-in rate limiting (60s for simulation, 30s for scanning) and a reduced 1fps video feed to minimize API token consumption and costs.

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

For detailed instructions on how to use the application, please refer to the [User Guide](USERGUIDE.md).

## Voice Commands

Once the live connection is established, you can use the following voice commands:

- **"Scan the area" / "Scan hazards"**: Initiates a structural hazard scan of the current camera view.
- **"Simulate an earthquake"**: Generates a side-by-side visual simulation of the environment after a major earthquake.
- **"Close simulation"**: Closes the aftermath simulation and returns to the live camera feed.
- **"Stop live view" / "Disconnect"**: Closes the live connection, turns off the camera and microphone, and returns to the idle state.
- **Query Earthquakes**: Ask questions like "Where were there earthquakes below magnitude 5 today?" or "Were there any earthquakes above magnitude 7 last week?" to fetch specific data from the USGS API.

## Reproducible Testing Instructions for Judges

To thoroughly evaluate SeismicSight's multimodal capabilities, please follow these steps:

### Prerequisites
1. A device with a working camera and microphone (laptop, tablet, or mobile phone).
2. A modern web browser (Chrome recommended).

### Step 1: Initialization
1. Open the provided App URL.
2. If prompted, grant the browser permission to access your camera and microphone.
3. If the app requests a Gemini API key, enter a valid key (the key is securely stored in your session storage and never sent to our servers).
4. Click the **"Connect"** (or microphone) button to establish the WebRTC connection with the Gemini Live API.

### Step 2: Test Conversational AI & USGS Grounding
1. Once connected, say: *"Hello, what can you do?"* to verify the audio pipeline.
2. Test the USGS API integration by asking: *"Were there any earthquakes above magnitude 5 today?"* or *"Where was the largest earthquake this week?"*
3. **Expected Result:** The AI will verbally answer your question, and the left panel will update with the live seismic data fetched from the USGS API.

### Step 3: Test Real-Time Hazard Detection
1. Point your camera at your current environment (e.g., a room with furniture, or outdoors towards trees/structures).
2. Say: *"Scan the area"* or *"Scan the environment"*.
3. **Expected Result:** The AI will acknowledge the command verbally. The right panel ("Live Hazard Feed") will populate with a JSON-structured list of identified risks (e.g., unanchored furniture, tripping hazards) along with confidence scores and mitigation strategies.

### Step 4: Test Predictive Disaster Simulation
1. Keep your camera pointed at the scene.
2. Say: *"Simulate an earthquake"*.
3. **Expected Result:** The screen will transition to a side-by-side view. The left side shows your original camera feed, and the right side will display a highly realistic, AI-generated aftermath photo of your exact environment post-earthquake (generated via Gemini 3.1 Flash Image Preview).
4. Say: *"Close simulation"* to return to the live feed.

### Step 5: Disconnect
1. Say: *"Stop live view"* or click the red disconnect button to end the session.

---

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

- **Creation Journey**  
  ![Creation Journey](Seismic%20App%20creaation%20Journey.png)

## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [CHANGELOG.md](CHANGELOG.md).

## Disclaimer of Liability

**PREDICTIVE SIMULATION: NOT A REAL-TIME EVENT.**
This AI analysis and the generated simulations are for educational purposes only. In a real seismic event, follow local authority guidelines and established evacuation protocols immediately. The developers assume no liability for any actions taken based on the information provided by this application.

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
