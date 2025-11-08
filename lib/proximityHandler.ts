/**
 * Proximity Handler
 * 
 * Handles proximity detection and notifications for matching interests.
 * Uses location services to detect nearby users.
 */

import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { getProfileById, Profile, updateProfile, supabase, SUPABASE_URL } from './supabaseClient';
import { calculateInterestOverlap } from './qrHandler';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Threshold for interest matching (50%)
const INTEREST_MATCH_THRESHOLD = 50;

// Minimum distance in meters to consider someone "nearby"
const PROXIMITY_DISTANCE_METERS = 50;

// How often to check for nearby users (in milliseconds)
const PROXIMITY_CHECK_INTERVAL = 30000; // 30 seconds

let proximityCheckInterval: NodeJS.Timeout | null = null;
let currentUserId: string | null = null;
let currentUserProfile: Profile | null = null;
let lastKnownLocation: Location.LocationObject | null = null;

/**
 * Request permissions for location and notifications
 */
export async function requestProximityPermissions(): Promise<boolean> {
  try {
    // Request location permission
    const { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
    if (locationStatus !== 'granted') {
      console.warn('Location permission not granted');
      return false;
    }

    // Request notification permission
    const { status: notificationStatus } = await Notifications.requestPermissionsAsync();
    if (notificationStatus !== 'granted') {
      console.warn('Notification permission not granted');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}

/**
 * Configure notification handler
 */
export async function configureNotifications() {
  // Set notification handler
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Start proximity detection
 * @param userId - Current user's ID
 */
export async function startProximityDetection(userId: string) {
  currentUserId = userId;

  // Request permissions
  const hasPermissions = await requestProximityPermissions();
  if (!hasPermissions) {
    console.warn('Proximity detection requires location and notification permissions');
    // Still continue in demo mode even without permissions for testing
  }

  // Configure notifications
  await configureNotifications();

  // Load current user profile
  try {
    currentUserProfile = await getProfileById(userId);
    if (!currentUserProfile) {
      console.warn('Could not load user profile for proximity detection');
      return;
    }
  } catch (error) {
    console.error('Error loading user profile:', error);
    return;
  }

  // Start location tracking
  await startLocationTracking();

  // Start checking for nearby users
  if (proximityCheckInterval) {
    clearInterval(proximityCheckInterval);
  }

  proximityCheckInterval = setInterval(async () => {
    await checkForNearbyUsers();
  }, PROXIMITY_CHECK_INTERVAL);

  console.log('Proximity detection started');
  
  // In demo mode, also check immediately and create test profiles if needed
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    setTimeout(async () => {
      await checkForNearbyUsers();
    }, 5000); // Check after 5 seconds
  }
}

/**
 * Stop proximity detection
 */
export function stopProximityDetection() {
  if (proximityCheckInterval) {
    clearInterval(proximityCheckInterval);
    proximityCheckInterval = null;
  }
  console.log('Proximity detection stopped');
}

/**
 * Start tracking user location
 */
async function startLocationTracking() {
  try {
    // Get current location
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    lastKnownLocation = location;

    // Update location in background
    Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 60000, // Update every minute
        distanceInterval: 10, // Update every 10 meters
      },
      (location) => {
        lastKnownLocation = location;
        updateUserLocation(location);
      }
    );
  } catch (error) {
    console.error('Error starting location tracking:', error);
  }
}

/**
 * Update user's location in Supabase or local storage
 */
async function updateUserLocation(location: Location.LocationObject) {
  if (!currentUserId) return;

  try {
    // In demo mode, update local storage
    if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
      // Update profile in local storage with location
      const storedProfiles = await AsyncStorage.getItem('demo_profiles');
      if (storedProfiles) {
        const profiles = JSON.parse(storedProfiles);
        const profileIndex = profiles.findIndex((p: Profile) => p.id === currentUserId);
        if (profileIndex !== -1) {
          profiles[profileIndex] = {
            ...profiles[profileIndex],
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            last_seen: new Date().toISOString(),
          };
          await AsyncStorage.setItem('demo_profiles', JSON.stringify(profiles));
          console.log('📝 Demo mode: Location updated in local storage');
        }
      }
    } else {
      // Update location in Supabase
      await updateProfile(currentUserId, {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        last_seen: new Date().toISOString(),
      } as any);
    }

    // Also store locally for quick access
    await AsyncStorage.setItem(
      `user_location_${currentUserId}`,
      JSON.stringify({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (error) {
    console.error('Error updating user location:', error);
  }
}

/**
 * Check for nearby users and send notifications if interests match
 */
async function checkForNearbyUsers() {
  if (!currentUserId || !currentUserProfile || !lastKnownLocation) {
    return;
  }

  try {
    // In a real implementation, you'd query Supabase for nearby users
    // For now, we'll simulate this by checking stored locations
    // This is a simplified version - in production, use Supabase PostGIS or similar

    // Get all stored user locations (simulated)
    // In production: Query Supabase for users within PROXIMITY_DISTANCE_METERS
    const nearbyUsers = await findNearbyUsers(
      lastKnownLocation.coords.latitude,
      lastKnownLocation.coords.longitude
    );

    // Check each nearby user for interest matches
    for (const nearbyUser of nearbyUsers) {
      if (nearbyUser.id === currentUserId) continue;

      const overlap = calculateInterestOverlap(
        currentUserProfile.interests,
        nearbyUser.interests
      );

      if (overlap >= INTEREST_MATCH_THRESHOLD) {
        // Don't notify about yourself
        if (nearbyUser.id === currentUserId) {
          continue;
        }
        
        // Check if we've already notified about this user recently
        const lastNotified = await AsyncStorage.getItem(
          `notified_${nearbyUser.id}`
        );
        const now = Date.now();
        const oneHour = 60 * 60 * 1000;

        if (!lastNotified || now - parseInt(lastNotified) > oneHour) {
          // Send notification
          console.log(`📱 Sending proximity notification: ${nearbyUser.name} has ${overlap}% matching interests`);
          await sendProximityNotification(nearbyUser, overlap);
          await AsyncStorage.setItem(
            `notified_${nearbyUser.id}`,
            now.toString()
          );
        }
      }
    }
  } catch (error) {
    console.error('Error checking for nearby users:', error);
  }
}

/**
 * Find nearby users by querying Supabase or local storage
 */
async function findNearbyUsers(
  latitude: number,
  longitude: number
): Promise<Profile[]> {
  if (!currentUserId || !currentUserProfile) return [];

  // In demo mode, get all profiles from local storage
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedProfiles = await AsyncStorage.getItem('demo_profiles');
      if (storedProfiles) {
        const profiles = JSON.parse(storedProfiles);
        // Filter out current user by ID and name
        const nearbyProfiles = profiles.filter((p: Profile) => 
          p.id !== currentUserId && 
          p.name !== currentUserProfile.name &&
          p.name !== null
        );
        
        // If profiles have locations, filter by distance
        // Otherwise, consider all other profiles as "nearby" for demo purposes
        if (nearbyProfiles.some((p: Profile) => p.latitude !== null && p.longitude !== null)) {
          const withLocation = nearbyProfiles.filter((p: Profile) => 
            p.latitude !== null && 
            p.longitude !== null
          );
          
          const withinRange = withLocation.filter((user: Profile) => {
            if (!user.latitude || !user.longitude) return false;
            const distance = calculateDistance(
              latitude,
              longitude,
              user.latitude,
              user.longitude
            );
            return distance <= PROXIMITY_DISTANCE_METERS;
          });
          
          console.log(`📱 Found ${withinRange.length} nearby users in demo mode (with location)`);
          return withinRange as Profile[];
        } else {
          // For demo: if no locations, return all other profiles as "nearby"
          // This allows testing proximity notifications even without location
          console.log(`📱 Demo mode: Found ${nearbyProfiles.length} other users (no location data)`);
          return nearbyProfiles as Profile[];
        }
      }
      return [];
    } catch (error) {
      console.error('Error finding nearby users in demo mode:', error);
      return [];
    }
  }

  try {
    // Query Supabase for nearby users
    // Using a simple distance calculation (Haversine formula would be better with PostGIS)
    // For now, we'll get users within a bounding box
    const latDelta = PROXIMITY_DISTANCE_METERS / 111000; // Rough conversion: 1 degree ≈ 111km
    const lonDelta = PROXIMITY_DISTANCE_METERS / (111000 * Math.cos(latitude * Math.PI / 180));

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .neq('id', currentUserId) // Exclude current user
      .not('latitude', 'is', null)
      .not('longitude', 'is', null)
      .gte('latitude', latitude - latDelta)
      .lte('latitude', latitude + latDelta)
      .gte('longitude', longitude - lonDelta)
      .lte('longitude', longitude + lonDelta)
      .gte('last_seen', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Active in last 5 minutes
      .limit(50);

    if (error) {
      console.error('Error querying nearby users:', error);
      return [];
    }

    // Filter by actual distance (simple calculation)
    const nearbyUsers = (data || []).filter((user) => {
      if (!user.latitude || !user.longitude) return false;
      const distance = calculateDistance(
        latitude,
        longitude,
        user.latitude,
        user.longitude
      );
      return distance <= PROXIMITY_DISTANCE_METERS;
    });

    return nearbyUsers as Profile[];
  } catch (error) {
    console.error('Error finding nearby users:', error);
    return [];
  }
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
      Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Send a notification about a nearby user with matching interests
 */
async function sendProximityNotification(user: Profile, overlap: number) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🎯 Someone nearby shares your interests!',
        body: `${user.name || 'Someone'} is nearby and shares ${overlap}% of your interests!`,
        data: { userId: user.id, overlap },
        sound: true,
      },
      trigger: null, // Send immediately
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<Location.LocationObject | null> {
  try {
    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return location;
  } catch (error) {
    console.error('Error getting current location:', error);
    return null;
  }
}

