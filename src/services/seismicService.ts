import { SeismicData } from '../types';

/**
 * Fetches the latest significant earthquake data from USGS.
 * API Documentation: https://earthquake.usgs.gov/fdsnws/event/1/
 */
export async function fetchLatestSeismicEvent(): Promise<SeismicData | null> {
  try {
    // Fetching the latest earthquake with magnitude > 5.0
    const response = await fetch(
      'https://earthquake.usgs.gov/fdsnws/event/1/query?format=geojson&minmagnitude=5.0&orderby=time&limit=1'
    );

    if (!response.ok) {
      throw new Error(`USGS API error: ${response.statusText}`);
    }

    const data = await response.json();
    const feature = data.features?.[0];

    if (!feature) return null;

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
  } catch (error) {
    console.error('Failed to fetch seismic data:', error);
    return null;
  }
}
