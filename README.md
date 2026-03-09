# SeismicSight

SeismicSight is an elite Emergency Disaster Guardian application designed to provide real-time structural hazard analysis and predictive disaster simulations. By leveraging advanced AI vision and live seismic data, SeismicSight helps users identify potential risks in their environment and prepare for seismic events.

## Features

- **Real-Time Hazard Detection:** Continuously analyzes your camera feed to identify structural and environmental risks, such as unanchored furniture, exposed gas lines, and large glass panes.
- **Live Hazard Feed:** Displays a chronological log of detected hazards with confidence scores, allowing you to monitor risks as they are identified.
- **Predictive Disaster Simulation:** Generates realistic aftermath photos based on the current room layout and potential seismic magnitudes, helping visualize the impact of an earthquake.
- **USGS Data Integration:** Fetches live seismic data from the US Geological Survey (USGS) to provide real-time alerts and safety protocols based on recent global events.
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

## Configuration

To use the AI features, you will need a valid Google Gemini API key. The application will prompt you to select or enter your key upon initialization.

## Disclaimer

**PREDICTIVE SIMULATION: NOT A REAL-TIME EVENT.**
This AI analysis is for simulation and training purposes. In a real seismic event, follow local authority guidelines and established evacuation protocols immediately.
