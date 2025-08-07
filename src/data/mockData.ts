export interface Restaurant {
  id: string;
  name: string;
  type: 'restaurant' | 'cafe' | 'fast_food' | 'bakery' | 'street_food';
  latitude: number;
  longitude: number;
  rating: number;
  distance?: number;
  description: string;
  image: string;
}

export const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    name: 'Zaiqa Restaurant',
    type: 'restaurant',
    latitude: 31.471212,
    longitude: 74.41032,
    rating: 4.5,
    description: 'Traditional Pakistani food with great taste',
    image: '🍛',
  },
  {
    id: '2',
    name: 'Bundu Khan Cafe',
    type: 'cafe',
    latitude: 31.470698,
    longitude: 74.408912,
    rating: 4.3,
    description: 'Desi breakfast and karak chai in a cozy environment',
    image: '☕',
  },
  {
    id: '3',
    name: 'Burger Express',
    type: 'fast_food',
    latitude: 31.470365,
    longitude: 74.411789,
    rating: 4.0,
    description: 'Fast and juicy burgers near Shaukat Khanum',
    image: '🍔',
  },
  {
    id: '4',
    name: 'Sweet Bites Bakery',
    type: 'bakery',
    latitude: 31.472145,
    longitude: 74.409003,
    rating: 4.6,
    description: 'Fresh cakes and bakery items daily',
    image: '🧁',
  },
  {
    id: '5',
    name: 'Tikka Truck',
    type: 'street_food',
    latitude: 31.471543,
    longitude: 74.407899,
    rating: 4.2,
    description: 'Roadside BBQ with mouthwatering tikka',
    image: '🍢',
  },
  {
    id: '6',
    name: 'Sushi Lahore',
    type: 'restaurant',
    latitude: 31.469812,
    longitude: 74.410102,
    rating: 4.7,
    description: 'Fresh sushi and pan-Asian cuisine',
    image: '🍣',
  },
  {
    id: '7',
    name: 'Pasta Point',
    type: 'restaurant',
    latitude: 31.470701,
    longitude: 74.412012,
    rating: 4.4,
    description: 'Italian flavors near Johar Town',
    image: '🍝',
  },
  {
    id: '8',
    name: 'Smoothie Zone',
    type: 'cafe',
    latitude: 31.47198,
    longitude: 74.408651,
    rating: 4.1,
    description: 'Healthy smoothies and fresh juices',
    image: '🥤',
  },
  {
    id: '9',
    name: 'BBQ Masters',
    type: 'restaurant',
    latitude: 31.46899,
    longitude: 74.40997,
    rating: 4.6,
    description: 'Smoked ribs and grilled meat platters',
    image: '🍖',
  },
  {
    id: '10',
    name: 'Lahore Creamery',
    type: 'cafe',
    latitude: 31.47267,
    longitude: 74.410112,
    rating: 4.3,
    description: 'Ice cream with local and international flavors',
    image: '🍦',
  },
];
// Default center location (San Francisco - you can change this to your preferred location)
export const DEFAULT_LOCATION = {
  latitude: 31.454052,
  longitude: 74.275201,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};
// 31.454052, 74.275201
