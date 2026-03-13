# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-03-13

### Added
- **API Key Configuration:** Added support for serving the Gemini API key via backend environment variables (`/api/config`) for seamless Cloud Run deployments.
- **Manual API Key Prompt:** Added a fallback manual prompt for users to enter their Gemini API key if it is not provided via environment variables or the AI Studio interface.

### Changed
- Updated `README.md` and `userguide.md` to reflect the new API key configuration methods and deployment instructions.
- Bumped version to `1.2.0`.

## [1.1.0] - 2026-03-09

### Added
- **Voice Commands:** Added ability to control the application hands-free. Supported commands include scanning the room, simulating an earthquake, closing the simulation, and stopping the live view.
- **USGS API Querying:** The voice assistant can now answer complex questions about historical earthquake data (e.g., largest magnitude in the last 90 days, regions with the most earthquakes) by querying the USGS API.
- **Disconnect Button:** Added a prominent red power button to the camera controls overlay to easily stop the live view and end the session.
- **Side-by-Side Simulation:** The predictive disaster simulation now displays a side-by-side comparison of the original room and the simulated aftermath.

### Changed
- Updated `queryEarthquakesApi` to support `orderBy` and higher limits (up to 500) for more advanced data analysis.
- Updated system instructions to guide the AI on using the new tools and handling complex user queries.

## [1.0.0] - Initial Release

### Added
- Real-time structural hazard detection using camera feed.
- Live hazard feed with confidence scores.
- Predictive disaster simulation based on current room layout.
- Integration with USGS Earthquake Hazards Program API for live seismic data.
- Adjustable confidence threshold for hazard detection.
