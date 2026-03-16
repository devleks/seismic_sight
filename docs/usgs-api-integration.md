# USGS API Integration Guide

Welcome to the team! As part of your onboarding to the SeismicSight project, this document will walk you through how we fetch and process real-time earthquake data using the United States Geological Survey (USGS) API.

## 1. The Endpoint

We use the USGS Earthquake Catalog API, specifically the `query` endpoint:
`GET https://earthquake.usgs.gov/fdsnws/event/1/query`

**Why this API?**
- It's a public government resource.
- It requires **no API keys** or authentication.
- It returns data in a standardized GeoJSON format.

## 2. How We Request Data

We don't send a JSON body. Instead, we use URL query parameters to filter the data. 
We have two main use cases in our app: fetching recent significant events for the dashboard, and allowing the AI to run custom queries based on user voice prompts.

Here is the working code from `src/services/seismicService.ts`:

```typescript
import { SeismicData } from '../types';

// Fetch the latest significant earthquakes (Magnitude 5.0+)
export async function fetchRecentSeismicEvents(limit: number = 3): Promise<SeismicData[]> {
  try {
    const response = await fetch(
      `https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5.0&orderby=time&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.statusText}`);
    }

    const data = await response.json();
    const features = data.features || [];

    return features.map((feature: any) => {
      const { mag, place, time } = feature.properties;
      const [longitude, latitude, depth] = feature.geometry.coordinates;

      // Determine risk level based on magnitude
      let riskLevel: SeismicData['riskLevel'] = 'Moderate';
      if (mag >= 7.5) riskLevel = 'Critical';
      else if (mag >= 6.5) riskLevel = 'High';
      else if (mag >= 5.5) riskLevel = 'Moderate';

      return {
        magnitude: mag,
        location: place,
        depth: depth,
        timestamp: new Date(time).toISOString(),
        riskLevel
      };
    });
  } catch (error) {
    console.error('Failed to fetch seismic data:', error);
    return [];
  }
}
```

## 3. The Raw Response (What we receive)

The USGS API returns a `FeatureCollection`. 
It can be quite large, but here is a simplified look at the raw JSON structure we get back:

```json
{
  "type": "FeatureCollection",
  "metadata": {
    "generated": 1710584000000,
    "url": "https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5.0&orderby=time&limit=1",
    "title": "USGS Earthquakes",
    "status": 200,
    "api": "1.14.0",
    "count": 1
  },
  "features": [
    {
      "type": "Feature",
      "properties": {
        "mag": 5.4,
        "place": "12 km SW of Searchlight, Nevada",
        "time": 1710583200000,
        "updated": 1710583500000,
        "tz": null,
        "url": "https://earthquake.usgs.gov/earthquakes/eventpage/nn00874321",
        "detail": "https://earthquake.usgs.gov/fdsnws/event/1/query?eventid=nn00874321&format=geojson",
        "felt": 42,
        "cdi": 4.1,
        "mmi": null,
        "alert": "green",
        "status": "reviewed",
        "tsunami": 0,
        "sig": 449,
        "net": "nn",
        "code": "00874321",
        "ids": ",nn00874321,",
        "sources": ",nn,",
        "types": ",dyfi,origin,phase-data,",
        "nst": 24,
        "dmin": 0.12,
        "rms": 0.22,
        "gap": 45,
        "magType": "ml",
        "type": "earthquake",
        "title": "M 5.4 - 12 km SW of Searchlight, Nevada"
      },
      "geometry": {
        "type": "Point",
        "coordinates": [
          -114.98,
          35.38,
          10.5
        ]
      },
      "id": "nn00874321"
    }
  ]
}
```

## 4. The Parsed Result (What we use)

Passing that massive raw JSON directly to our UI or the Gemini AI would waste memory and tokens. 
Instead, our `fetchRecentSeismicEvents` function maps the raw data into our clean `SeismicData` interface.

Here is the parsed result that our application actually uses:

```json
[
  {
    "magnitude": 5.4,
    "location": "12 km SW of Searchlight, Nevada",
    "depth": 10.5,
    "timestamp": "2024-03-16T10:00:00.000Z",
    "riskLevel": "Moderate"
  }
]
```

### Key Takeaways for Parsing:
1. **Magnitude:** Mapped directly from `feature.properties.mag`.
2. **Location:** Mapped directly from `feature.properties.place`.
3. **Timestamp:** We convert the UNIX timestamp (`feature.properties.time`) into a readable ISO string using `new Date(time).toISOString()`.
4. **Depth:** We extract the 3rd item from the geometry array (`feature.geometry.coordinates[2]`).
5. **Risk Level:** We calculate a human-readable risk level (`Moderate`, `High`, or `Critical`) based on the magnitude to make it easier for the UI to color-code alerts.

If you have any questions about this implementation, feel free to ask!
