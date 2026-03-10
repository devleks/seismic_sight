import { SeismicData } from '../types';

/**
 * Fetches the latest significant earthquake data from USGS.
 * API Documentation: https://earthquake.usgs.gov/fdsnws/event/1/
 */
export async function fetchLatestSeismicEvent(): Promise<SeismicData | null> {
  const events = await fetchRecentSeismicEvents(1);
  return events.length > 0 ? events[0] : null;
}

export async function fetchRecentSeismicEvents(limit: number = 3): Promise<SeismicData[]> {
  try {
    // Fetching the latest earthquakes with magnitude > 5.0
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

export async function queryEarthquakesApi(params: {
  minMagnitude?: number;
  maxMagnitude?: number;
  startTime?: string;
  endTime?: string;
  limit?: number;
  orderBy?: 'time' | 'time-asc' | 'magnitude' | 'magnitude-asc';
}): Promise<any> {
  try {
    const url = new URL('https://earthquake.usgs.gov/fdsnws/event/1/query');
    url.searchParams.append('format', 'geojson');
    if (params.minMagnitude !== undefined) url.searchParams.append('minmagnitude', params.minMagnitude.toString());
    if (params.maxMagnitude !== undefined) url.searchParams.append('maxmagnitude', params.maxMagnitude.toString());
    if (params.startTime) url.searchParams.append('starttime', params.startTime);
    if (params.endTime) url.searchParams.append('endtime', params.endTime);
    url.searchParams.append('limit', (params.limit || 50).toString());
    url.searchParams.append('orderby', params.orderBy || 'time');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`USGS API error: ${response.statusText}`);
    
    const data = await response.json();
    return (data.features || []).map((f: any) => ({
      magnitude: f.properties.mag,
      location: f.properties.place,
      time: new Date(f.properties.time).toISOString(),
      depth: f.geometry.coordinates[2]
    }));
  } catch (error) {
    console.error('Failed to query earthquakes:', error);
    return { error: 'Failed to fetch data from USGS API' };
  }
}
