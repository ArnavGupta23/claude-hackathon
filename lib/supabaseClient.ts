/**
 * Supabase Client Configuration
 * 
 * Initialize Supabase client for database operations.
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your actual Supabase credentials.
 */

import { createClient } from '@supabase/supabase-js';

// TODO: Replace these with your actual Supabase project credentials
// Get these from your Supabase project settings: https://app.supabase.com/project/_/settings/api
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

// Check if Supabase is configured
const isSupabaseConfigured = 
  SUPABASE_URL !== 'YOUR_SUPABASE_URL' && 
  SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY' &&
  SUPABASE_URL.startsWith('http');

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase not configured! App will run in demo mode. Update lib/supabaseClient.ts with your credentials.');
}

/**
 * Create and export Supabase client instance
 * This client is used throughout the app for database operations
 * Uses a valid placeholder URL if not configured to prevent errors
 */
export const supabase = isSupabaseConfigured
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : createClient('https://placeholder.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBsYWNlaG9sZGVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NDUxOTIwMDAsImV4cCI6MTk2MDc2ODAwMH0.placeholder');

/**
 * Database Types
 * These match the Supabase schema defined in the requirements
 */
export interface Profile {
  id: string;
  name: string | null;
  major: string | null;
  interests: string[] | null;
  bio: string | null;
  nfc_tag: string | null;
  latitude: number | null;
  longitude: number | null;
  last_seen: string | null;
  created_at: string;
  // Social media links
  linkedin?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  github?: string | null;
  email?: string | null;
  phone?: string | null;
}

export interface Connection {
  id: number;
  user_a: string;
  user_b: string;
  connected_at: string;
}

/**
 * Profile Operations
 */

/**
 * Create a new user profile in Supabase
 * @param profileData - Profile data to insert
 * @returns Created profile or error
 */
export async function createProfile(profileData: {
  name: string;
  major: string;
  interests: string[];
  bio?: string;
  nfc_tag?: string;
}) {
  // Check if Supabase is configured
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    // Demo mode: return a mock profile and store it locally
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    
    // Generate a unique ID based on device + timestamp to ensure uniqueness
    const deviceId = await AsyncStorage.getItem('device_id') || `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await AsyncStorage.setItem('device_id', deviceId);
    
    const mockProfile: Profile = {
      id: `demo-${deviceId}-${Date.now()}`,
      name: profileData.name,
      major: profileData.major,
      interests: profileData.interests,
      bio: profileData.bio || null,
      nfc_tag: profileData.nfc_tag || null,
      latitude: null,
      longitude: null,
      last_seen: new Date().toISOString(),
      created_at: new Date().toISOString(),
    };
    
    // Store profile in AsyncStorage for demo mode
    try {
      const storedProfiles = await AsyncStorage.getItem('demo_profiles');
      const profiles = storedProfiles ? JSON.parse(storedProfiles) : [];
      profiles.push(mockProfile);
      await AsyncStorage.setItem('demo_profiles', JSON.stringify(profiles));
      console.log('📝 Demo mode: Profile created and stored locally');
    } catch (error) {
      console.error('Error storing profile:', error);
    }
    
    return mockProfile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .insert([profileData])
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Fetch a profile by ID
 * @param profileId - UUID of the profile
 * @returns Profile or null if not found
 */
export async function getProfileById(profileId: string): Promise<Profile | null> {
  // Check if Supabase is configured
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    // Demo mode: try to get from AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedProfiles = await AsyncStorage.getItem('demo_profiles');
      if (storedProfiles) {
        const profiles = JSON.parse(storedProfiles);
        // Try exact match first
        let profile = profiles.find((p: Profile) => p.id === profileId);
        
        // If not found, try to match by prefix (in case ID format changed)
        if (!profile && profileId.startsWith('demo-')) {
          profile = profiles.find((p: Profile) => p.id && p.id.toString().includes(profileId.split('-')[1]));
        }
        
        // If still not found, get the most recent profile
        if (!profile && profiles.length > 0) {
          profile = profiles[profiles.length - 1];
          console.log('📝 Demo mode: Using most recent profile as fallback');
        }
        
        if (profile) {
          console.log('📝 Demo mode: Profile loaded from local storage:', profile.id);
          return profile;
        }
      }
      console.log('📝 Demo mode: No profiles found in local storage');
      return null;
    } catch (error) {
      console.error('Error loading profile from storage:', error);
      return null;
    }
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', profileId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
  return data as Profile;
}

/**
 * Fetch a profile by NFC tag
 * @param nfcTag - NFC tag identifier
 * @returns Profile or null if not found
 */
export async function getProfileByNfcTag(nfcTag: string): Promise<Profile | null> {
  // Check if Supabase is configured
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.log('📝 Demo mode: Supabase not configured, returning null');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('nfc_tag', nfcTag)
    .single();

  if (error) {
    console.error('Error fetching profile by NFC tag:', error);
    return null;
  }
  return data as Profile;
}

/**
 * Update an existing profile
 * @param profileId - UUID of the profile to update
 * @param updates - Partial profile data to update
 * @returns Updated profile or error
 */
export async function updateProfile(
  profileId: string,
  updates: Partial<Profile>
) {
  // Check if Supabase is configured
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.log('📝 Demo mode: Updating profile in local storage');

    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedProfiles = await AsyncStorage.getItem('demo_profiles');

      if (storedProfiles) {
        const profiles = JSON.parse(storedProfiles);
        const profileIndex = profiles.findIndex((p: Profile) => p.id === profileId);

        if (profileIndex !== -1) {
          // Update the profile
          profiles[profileIndex] = {
            ...profiles[profileIndex],
            ...updates,
          };
          await AsyncStorage.setItem('demo_profiles', JSON.stringify(profiles));
          console.log('📝 Demo mode: Profile updated in local storage');
          return profiles[profileIndex] as Profile;
        }
      }
    } catch (error) {
      console.error('Error updating profile in demo mode:', error);
    }

    // Return a mock updated profile if update failed
    return {
      id: profileId,
      name: null,
      major: null,
      interests: null,
      bio: null,
      nfc_tag: null,
      latitude: null,
      longitude: null,
      last_seen: null,
      created_at: new Date().toISOString(),
      ...updates,
    } as Profile;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', profileId)
    .select()
    .single();

  if (error) throw error;
  return data as Profile;
}

/**
 * Connection Operations
 */

/**
 * Create a connection between two users
 * @param userAId - UUID of first user
 * @param userBId - UUID of second user
 * @returns Created connection or error
 */
export async function createConnection(userAId: string, userBId: string) {
  // Check if Supabase is configured
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    // Demo mode: return a mock connection and store it
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const mockConnection: Connection = {
      id: Date.now(),
      user_a: userAId < userBId ? userAId : userBId,
      user_b: userAId < userBId ? userBId : userAId,
      connected_at: new Date().toISOString(),
    };
    
    // Store connection in AsyncStorage
    try {
      const storedConnections = await AsyncStorage.getItem('demo_connections');
      const connections = storedConnections ? JSON.parse(storedConnections) : [];
      
      // Check if connection already exists
      const exists = connections.some(
        (conn: Connection) => 
          (conn.user_a === mockConnection.user_a && conn.user_b === mockConnection.user_b) ||
          (conn.user_a === mockConnection.user_b && conn.user_b === mockConnection.user_a)
      );
      
      if (!exists) {
        connections.push(mockConnection);
        await AsyncStorage.setItem('demo_connections', JSON.stringify(connections));
        console.log('📝 Demo mode: Connection created and stored locally:', mockConnection);
        
        // Also log connection to a separate log file for tracking
        try {
          const connectionLog = await AsyncStorage.getItem('nfc_connection_log') || '[]';
          const log = JSON.parse(connectionLog);
          log.push({
            ...mockConnection,
            timestamp: new Date().toISOString(),
            method: 'nfc',
          });
          await AsyncStorage.setItem('nfc_connection_log', JSON.stringify(log));
          console.log('📝 NFC connection logged');
        } catch (logError) {
          console.error('Error logging connection:', logError);
        }
      } else {
        console.log('📝 Demo mode: Connection already exists');
      }
    } catch (error) {
      console.error('Error storing connection:', error);
    }
    
    return mockConnection;
  }

  // Ensure consistent ordering to avoid duplicate connections
  const [userA, userB] = [userAId, userBId].sort();

  // Check if connection already exists
  const { data: existing } = await supabase
    .from('connections')
    .select('*')
    .eq('user_a', userA)
    .eq('user_b', userB)
    .single();

  if (existing) {
    return existing as Connection;
  }

  const { data, error } = await supabase
    .from('connections')
    .insert([{ user_a: userA, user_b: userB }])
    .select()
    .single();

  if (error) throw error;
  return data as Connection;
}

/**
 * Get all connections for a user
 * @param userId - UUID of the user
 * @returns Array of connections with profile data
 */
export async function getUserConnections(userId: string) {
  // Check if Supabase is configured
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    // Demo mode: get connections from AsyncStorage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedConnections = await AsyncStorage.getItem('demo_connections');
      if (storedConnections) {
        const connections = JSON.parse(storedConnections);
        const userConnections = connections.filter(
          (conn: Connection) => conn.user_a === userId || conn.user_b === userId
        );
        
        // Get profiles for connections
        const connectionsWithProfiles = await Promise.all(
          userConnections.map(async (conn: Connection) => {
            const otherUserId = conn.user_a === userId ? conn.user_b : conn.user_a;
            const profile = await getProfileById(otherUserId);
            return {
              ...conn,
              profile: profile,
            };
          })
        );
        
        console.log('📝 Demo mode: Connections loaded from local storage');
        return connectionsWithProfiles;
      }
      console.log('📝 Demo mode: No connections found');
      return [];
    } catch (error) {
      console.error('Error loading connections:', error);
      return [];
    }
  }

  // Get connections where user is either user_a or user_b
  const { data, error } = await supabase
    .from('connections')
    .select('*')
    .or(`user_a.eq.${userId},user_b.eq.${userId}`)
    .order('connected_at', { ascending: false });

  if (error) throw error;

  // Fetch profile data for connected users
  const connectionsWithProfiles = await Promise.all(
    (data || []).map(async (conn) => {
      const otherUserId = conn.user_a === userId ? conn.user_b : conn.user_a;
      const profile = await getProfileById(otherUserId);
      return {
        ...conn,
        profile: profile,
      };
    })
  );

  return connectionsWithProfiles;
}

