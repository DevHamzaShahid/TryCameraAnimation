export interface Coordinate {
  latitude: number;
  longitude: number;
}

// Calculate distance between two coordinates using Haversine formula
export const calculateDistance = (
  coord1: Coordinate,
  coord2: Coordinate,
): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(coord1.latitude)) *
      Math.cos(toRadians(coord2.latitude)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Distance in kilometers
};

// Calculate bearing between two coordinates
export const calculateBearing = (
  coord1: Coordinate,
  coord2: Coordinate,
): number => {
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);

  const bearing = toDegrees(Math.atan2(y, x));
  return (bearing + 360) % 360; // Normalize to 0-360 degrees
};

// Convert degrees to radians
const toRadians = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

// Convert radians to degrees
const toDegrees = (radians: number): number => {
  return radians * (180 / Math.PI);
};

// Create a simple straight line path between two points
export const createDirectionLine = (
  start: Coordinate,
  end: Coordinate,
): Coordinate[] => {
  const steps = 20; // Number of points in the line
  const latStep = (end.latitude - start.latitude) / steps;
  const lonStep = (end.longitude - start.longitude) / steps;

  const path: Coordinate[] = [];

  for (let i = 0; i <= steps; i++) {
    path.push({
      latitude: start.latitude + latStep * i,
      longitude: start.longitude + lonStep * i,
    });
  }

  return path;
};

// Find nearest restaurants to a given location
export const findNearestRestaurants = (
  userLocation: Coordinate,
  restaurants: any[],
  limit: number = 5,
) => {
  return restaurants
    .map(restaurant => ({
      ...restaurant,
      distance: calculateDistance(userLocation, {
        latitude: restaurant.latitude,
        longitude: restaurant.longitude,
      }),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
};

// Create a curved path (simple bezier-like curve)
export const createCurvedPath = (
  start: Coordinate,
  end: Coordinate,
): Coordinate[] => {
  const steps = 30;
  const path: Coordinate[] = [];

  // Create a control point for the curve (offset perpendicular to the line)
  const midLat = (start.latitude + end.latitude) / 2;
  const midLon = (start.longitude + end.longitude) / 2;

  // Offset the control point slightly
  const offset = 0.001;
  const controlPoint = {
    latitude: midLat + offset,
    longitude: midLon + offset,
  };

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const t2 = t * t;
    const t3 = 1 - t;
    const t32 = t3 * t3;

    // Quadratic Bezier curve formula
    const lat =
      t32 * start.latitude +
      2 * t3 * t * controlPoint.latitude +
      t2 * end.latitude;
    const lon =
      t32 * start.longitude +
      2 * t3 * t * controlPoint.longitude +
      t2 * end.longitude;

    path.push({ latitude: lat, longitude: lon });
  }

  return path;
};
