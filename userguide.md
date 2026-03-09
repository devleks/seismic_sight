# SeismicSight User Guide

Welcome to SeismicSight, your Emergency Disaster Guardian. This guide will help you navigate the application and utilize its features to assess and prepare for seismic hazards in your environment.

## Getting Started

When you first open SeismicSight, you will be prompted to provide access to your camera and microphone. These are necessary for the real-time hazard detection and voice interaction features. You will also need to authenticate with a valid Google Gemini API key to enable the AI analysis.

## Main Interface

The SeismicSight dashboard is divided into several key areas:

### 1. Camera Feed & Controls
- **Live View:** The main central area displays your active camera feed. This is the environment the AI will analyze.
- **Controls (Bottom Center):**
  - **Mic Toggle:** Mute or unmute your microphone for voice commands.
  - **Video Toggle:** Turn your camera feed on or off.
  - **Scan Button (Center):** Click the large red button to initiate a structural hazard scan of the current view.

### 2. Global Seismic Activity (Left Panel)
This panel displays the most recent significant earthquake detected by the USGS Global Network.
- **Magnitude & Location:** Shows the strength and epicenter of the event.
- **Risk Level:** Categorizes the event as Low, Moderate, High, or Critical.
- **Safety Protocol:** Provides immediate, actionable advice based on the magnitude of the event.

### 3. Safety Analysis & Live Hazard Feed (Right Panel)
This panel is your primary tool for understanding local risks.
- **Confidence Slider:** Located at the top of the panel, this slider lets you adjust the AI's sensitivity. Higher confidence means fewer false positives, but might miss subtle hazards.
- **Live Hazard Feed:** As you run a scan, detected hazards will appear here chronologically. Each entry includes:
  - **Hazard Type:** (e.g., Falling, Fire, Structural, Glass, Exit)
  - **Confidence Score:** The AI's certainty of the detection.
  - **Details:** Specific information about the risk and potential consequences.
- **Structural Integrity Index:** A percentage score representing the overall safety of the scanned environment.
- **Mitigation Strategy:** Actionable recommendations to address the identified hazards.

## Performing a Hazard Scan

1. Point your camera at the area you want to analyze (e.g., a room with heavy furniture, windows, or structural elements).
2. Adjust the **Confidence** slider if you want to filter out low-probability risks.
3. Click the red **Scan** button.
4. The system will pulse "ANALYZING..." and begin populating the **Live Hazard Feed** with identified risks.
5. Once the scan is complete, review the **Structural Integrity Index** and **Mitigation Strategy**.
6. Click **Clear All** to reset the analysis and prepare for a new scan.

## Predictive Disaster Simulation

*(Note: This feature is triggered automatically under specific high-risk conditions or via specific voice commands when fully integrated.)*
When activated, SeismicSight will generate a simulated image of your current environment showing the potential aftermath of a seismic event. 
**Always remember:** These images are predictive simulations for preparedness training, not real-time events.

## Emergency Protocols

In the event of an actual earthquake:
1. **Drop, Cover, and Hold On.**
2. Do not rely on the app during active shaking.
3. Follow all local emergency broadcast instructions.
