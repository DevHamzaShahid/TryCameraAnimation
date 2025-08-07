export interface Waypoint {
  id: string;
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  type:
    | 'restaurant'
    | 'gas_station'
    | 'hotel'
    | 'attraction'
    | 'shop'
    | 'hospital';
  priority: number; // 1 = highest priority
  status: 'pending' | 'active' | 'completed' | 'skipped';
  estimatedTime?: string;
  estimatedDistance?: string;
  icon: string;
  color: string;
}

// Sample waypoints for navigation (San Francisco area)
export const navigationWaypoints: Waypoint[] = [
  {
    id: 'wp-1',
    name: 'Shaukat Khanum Hospital',
    description: 'Main Hospital Entrance',
    latitude: 31.471121,
    longitude: 74.409942,
    type: 'hospital',
    priority: 1,
    status: 'pending',
    icon: '🏥',
    color: '#FF6B6B',
  },
  {
    id: 'wp-2',
    name: 'SKMCH Cafe',
    description: 'Hospital staff and visitor cafe',
    latitude: 31.471942,
    longitude: 74.410671,
    type: 'cafe',
    priority: 2,
    status: 'pending',
    icon: '☕',
    color: '#4ECDC4',
  },
  {
    id: 'wp-3',
    name: 'K&N’s Chicken Store',
    description: 'Famous poultry and frozen food outlet',
    latitude: 31.473843,
    longitude: 74.411914,
    type: 'shop',
    priority: 3,
    status: 'pending',
    icon: '🍗',
    color: '#45B7D1',
  },
  {
    id: 'wp-4',
    name: 'Bakery Junction',
    description: 'Local bakery with fresh cakes and snacks',
    latitude: 31.470033,
    longitude: 74.408111,
    type: 'bakery',
    priority: 4,
    status: 'pending',
    icon: '🎂',
    color: '#96CEB4',
  },
  {
    id: 'wp-5',
    name: 'Siddique Mart',
    description: 'Grocery store and convenience mart',
    latitude: 31.469402,
    longitude: 74.406212,
    type: 'shop',
    priority: 5,
    status: 'pending',
    icon: '🛒',
    color: '#FFEAA7',
  },
  {
    id: 'wp-6',
    name: 'Fitness Point Gym',
    description: 'Nearby gym and fitness club',
    latitude: 31.472719,
    longitude: 74.407715,
    type: 'attraction',
    priority: 6,
    status: 'pending',
    icon: '🏋️',
    color: '#DDA0DD',
  },
  {
    id: 'wp-7',
    name: 'Skyways Terminal',
    description: 'Intercity bus terminal',
    latitude: 31.474512,
    longitude: 74.408914,
    type: 'transport',
    priority: 7,
    status: 'pending',
    icon: '🚌',
    color: '#F39C12',
  },
  {
    id: 'wp-8',
    name: 'Cake & Bake',
    description: 'Well-known bakery chain outlet',
    latitude: 31.470212,
    longitude: 74.411293,
    type: 'bakery',
    priority: 8,
    status: 'pending',
    icon: '🧁',
    color: '#8E44AD',
  },
];

// Navigation settings
export const NAVIGATION_SETTINGS = {
  ARRIVAL_THRESHOLD: 50, // meters - distance to consider "arrived"
  ROUTE_UPDATE_INTERVAL: 5000, // ms - how often to recalculate route
  CAMERA_ANIMATION_DURATION: 1000, // ms
  NORTH_BEARING: 0, // degrees
  DEFAULT_ZOOM: 0.01, // map delta values
  NAVIGATION_ZOOM: 0.005, // closer zoom when navigating
};

// Get waypoints by status
export const getWaypointsByStatus = (
  status: Waypoint['status'],
): Waypoint[] => {
  return navigationWaypoints.filter(wp => wp.status === status);
};

// Get next waypoint in priority order
export const getNextWaypoint = (waypoints: Waypoint[]): Waypoint | null => {
  const pending = waypoints
    .filter(wp => wp.status === 'pending')
    .sort((a, b) => a.priority - b.priority);

  return pending.length > 0 ? pending[0] : null;
};

// Update waypoint status
export const updateWaypointStatus = (
  waypoints: Waypoint[],
  waypointId: string,
  status: Waypoint['status'],
): Waypoint[] => {
  return waypoints.map(wp => (wp.id === waypointId ? { ...wp, status } : wp));
};

// Get waypoint by ID
export const getWaypointById = (
  waypoints: Waypoint[],
  id: string,
): Waypoint | null => {
  return waypoints.find(wp => wp.id === id) || null;
};
