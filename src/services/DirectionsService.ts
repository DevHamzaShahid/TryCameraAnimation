import { Coordinate } from '../utils/locationUtils';

export interface RouteStep {
  distance: {
    text: string;
    value: number;
  };
  duration: {
    text: string;
    value: number;
  };
  end_location: {
    lat: number;
    lng: number;
  };
  start_location: {
    lat: number;
    lng: number;
  };
  html_instructions: string;
  maneuver?: string;
  polyline: {
    points: string;
  };
}

export interface DirectionsRoute {
  legs: Array<{
    distance: {
      text: string;
      value: number;
    };
    duration: {
      text: string;
      value: number;
    };
    steps: RouteStep[];
    start_address: string;
    end_address: string;
  }>;
  overview_polyline: {
    points: string;
  };
  summary: string;
  bounds: {
    northeast: { lat: number; lng: number };
    southwest: { lat: number; lng: number };
  };
}

export interface DirectionsResponse {
  routes: DirectionsRoute[];
  status: string;
  error_message?: string;
}

class DirectionsService {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/directions/json';

  constructor(apiKey: string = 'AIzaSyDwK5Xp8GFmWZ1yTpOin7Ma2gFLXxpIqhM') {
    this.apiKey = apiKey;
  }

  // Decode Google polyline string to coordinates
  decodePolyline(encoded: string): Coordinate[] {
    const coordinates: Coordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b: number;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return coordinates;
  }

  // Get directions between two points
  async getDirections(
    origin: Coordinate,
    destination: Coordinate,
    waypoints?: Coordinate[],
    mode: 'driving' | 'walking' | 'bicycling' | 'transit' = 'driving',
  ): Promise<{ coordinates: Coordinate[]; route: DirectionsRoute } | null> {
    try {
      const originStr = `${origin.latitude},${origin.longitude}`;
      const destinationStr = `${destination.latitude},${destination.longitude}`;

      let waypointsStr = '';
      if (waypoints && waypoints.length > 0) {
        waypointsStr = waypoints
          .map(wp => `${wp.latitude},${wp.longitude}`)
          .join('|');
      }

      const params = new URLSearchParams({
        origin: originStr,
        destination: destinationStr,
        mode,
        key: this.apiKey,
        ...(waypointsStr && { waypoints: waypointsStr }),
      });

      const response = await fetch(`${this.baseUrl}?${params}`);
      const data: DirectionsResponse = await response.json();

      if (data.status === 'OK' && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = this.decodePolyline(route.overview_polyline.points);

        return {
          coordinates,
          route,
        };
      } else {
        console.error('Directions API error:', data.status, data.error_message);
        return null;
      }
    } catch (error) {
      console.error('Error fetching directions:', error);
      return null;
    }
  }

  // Fallback: Create a simple route using mock waypoints (for offline/testing)
  createFallbackRoute(
    origin: Coordinate,
    destination: Coordinate,
  ): Coordinate[] {
    const steps = 20;
    const coordinates: Coordinate[] = [];

    // Add some curve to make it look more realistic
    const midLat = (origin.latitude + destination.latitude) / 2;
    const midLng = (origin.longitude + destination.longitude) / 2;

    // Create control points for a curved path
    const controlPoint1 = {
      latitude: midLat + (Math.random() - 0.5) * 0.002,
      longitude: midLng + (Math.random() - 0.5) * 0.002,
    };

    const controlPoint2 = {
      latitude: midLat + (Math.random() - 0.5) * 0.002,
      longitude: midLng + (Math.random() - 0.5) * 0.002,
    };

    // Generate curved path using cubic Bezier
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      const u = 1 - t;
      const u2 = u * u;
      const u3 = u2 * u;

      const lat =
        u3 * origin.latitude +
        3 * u2 * t * controlPoint1.latitude +
        3 * u * t2 * controlPoint2.latitude +
        t3 * destination.latitude;

      const lng =
        u3 * origin.longitude +
        3 * u2 * t * controlPoint1.longitude +
        3 * u * t2 * controlPoint2.longitude +
        t3 * destination.longitude;

      coordinates.push({ latitude: lat, longitude: lng });
    }

    return coordinates;
  }

  // Get estimated travel time and distance
  async getTravelInfo(
    origin: Coordinate,
    destination: Coordinate,
  ): Promise<{
    distance: string;
    duration: string;
  } | null> {
    try {
      const result = await this.getDirections(origin, destination);
      if (result?.route.legs[0]) {
        const leg = result.route.legs[0];
        return {
          distance: leg.distance.text,
          duration: leg.duration.text,
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting travel info:', error);
      return null;
    }
  }
}

export default DirectionsService;
