/**
 * Compass utility functions for handling device compass data
 */

/**
 * Normalize heading to 0-360 degree range
 */
export const normalizeHeading = (heading: number): number => {
  return ((heading % 360) + 360) % 360;
};

/**
 * Calculate the shortest angular distance between two headings
 */
export const angleDifference = (heading1: number, heading2: number): number => {
  const diff = normalizeHeading(heading2) - normalizeHeading(heading1);
  
  if (diff > 180) return diff - 360;
  if (diff < -180) return diff + 360;
  
  return diff;
};

/**
 * Smooth heading changes to prevent jittery rotation
 */
export const smoothHeading = (
  newHeading: number, 
  previousHeading: number, 
  smoothingFactor: number = 0.3
): number => {
  const diff = angleDifference(previousHeading, newHeading);
  return normalizeHeading(previousHeading + diff * smoothingFactor);
};

/**
 * Detect if compass is properly calibrated by checking range of values
 */
export const isCompassCalibrated = (headings: number[]): boolean => {
  if (headings.length < 10) return false;
  
  const min = Math.min(...headings);
  const max = Math.max(...headings);
  const range = max - min;
  
  // Check if we have a good range (should be close to 360°)
  return range > 300;
};

/**
 * Calculate compass accuracy based on heading stability
 */
export const calculateCompassAccuracy = (headings: number[]): number => {
  if (headings.length < 3) return 0;
  
  // Calculate standard deviation of recent headings
  const recent = headings.slice(-5);
  const mean = recent.reduce((sum, h) => sum + h, 0) / recent.length;
  const variance = recent.reduce((sum, h) => sum + Math.pow(h - mean, 2), 0) / recent.length;
  const stdDev = Math.sqrt(variance);
  
  // Convert to accuracy percentage (lower stdDev = higher accuracy)
  return Math.max(0, 100 - (stdDev / 3.6)); // 3.6 degrees = 1% accuracy
};

/**
 * Detect outliers in compass readings
 */
export const removeOutliers = (headings: number[], threshold: number = 45): number[] => {
  if (headings.length < 3) return headings;
  
  const sorted = [...headings].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  
  return headings.filter(heading => Math.abs(angleDifference(median, heading)) < threshold);
};

/**
 * Convert heading to cardinal direction
 */
export const headingToCardinal = (heading: number): string => {
  const normalized = normalizeHeading(heading);
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(normalized / 45) % 8;
  return directions[index];
};

/**
 * Calculate bearing between two points
 */
export const calculateBearing = (
  from: { latitude: number; longitude: number },
  to: { latitude: number; longitude: number }
): number => {
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const toDeg = (rad: number) => rad * (180 / Math.PI);
  
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  
  const bearing = toDeg(Math.atan2(y, x));
  return normalizeHeading(bearing);
}; 