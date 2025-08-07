/**
 * Throttle function to limit the rate of function calls
 * @param func Function to throttle
 * @param limit Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function (this: any, ...args: Parameters<T>) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Debounce function to delay function calls until after a certain time has elapsed
 * @param func Function to debounce
 * @param delay Delay in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * Calculate the difference between two angles (in degrees) handling 360° wraparound
 * @param angle1 First angle in degrees
 * @param angle2 Second angle in degrees
 * @returns Angle difference (-180 to 180)
 */
export function angleDifference(angle1: number, angle2: number): number {
  let diff = angle2 - angle1;
  while (diff > 180) diff -= 360;
  while (diff < -180) diff += 360;
  return diff;
}

/**
 * Interpolate between two angles handling 360° wraparound
 * @param from Starting angle in degrees
 * @param to Target angle in degrees
 * @param factor Interpolation factor (0-1)
 * @returns Interpolated angle
 */
export function interpolateAngle(from: number, to: number, factor: number): number {
  const diff = angleDifference(from, to);
  return from + diff * factor;
}