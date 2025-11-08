/**
 * LinkUp - NFC-Powered College Networking App
 * 
 * Main App component with navigation setup.
 * Handles onboarding flow and main app navigation.
 */

import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initNFC } from './lib/nfcHandler';
import * as Notifications from 'expo-notifications';

// Import screens
import { OnboardingScreen } from './screens/OnboardingScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { NFCScanScreen } from './screens/NFCScanScreen';
import { QRScanScreen } from './screens/QRScanScreen';
import { ConnectionsScreen } from './screens/ConnectionsScreen';
import { startProximityDetection, stopProximityDetection } from './lib/proximityHandler';

// Define navigation param types
export type RootStackParamList = {
  Onboarding: undefined;
  Profile: { profileId: string };
  Scan: { currentUserId: string };
  QRScan: { currentUserId: string };
  Connections: { userId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

/**
 * Main App Component
 * 
 * Manages app state and navigation flow:
 * 1. Checks if user has completed onboarding
 * 2. Initializes NFC on app start
 * 3. Sets up navigation stack
 */
export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  /**
   * Initialize app on mount
   * - Check for existing profile
   * - Initialize NFC
   */
  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      // Configure notifications
      await Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });

      // Request notification permissions
      await Notifications.requestPermissionsAsync();

      // Initialize NFC
      await initNFC();

      // Check if user has a profile
      const storedProfileId = await AsyncStorage.getItem('userProfileId');
      if (storedProfileId) {
        setProfileId(storedProfileId);
        setHasProfile(true);
        // Start proximity detection for existing users
        startProximityDetection(storedProfileId);
      }
    } catch (error) {
      console.error('Error initializing app:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Cleanup proximity detection on unmount
  useEffect(() => {
    return () => {
      if (profileId) {
        stopProximityDetection();
      }
    };
  }, [profileId]);

  /**
   * Handle onboarding completion
   * Saves profile ID and navigates to profile screen
   */
  const handleOnboardingComplete = async (newProfileId: string) => {
    await AsyncStorage.setItem('userProfileId', newProfileId);
    setProfileId(newProfileId);
    setHasProfile(true);
    // Start proximity detection for new users
    startProximityDetection(newProfileId);
  };

  /**
   * Handle sign out
   * Clears all user data and returns to onboarding
   */
  const handleSignOut = async () => {
    try {
      // Stop proximity detection
      stopProximityDetection();

      // Clear all AsyncStorage keys
      const keys = [
        'userProfileId',
        'device_id',
        'demo_profiles',
        'demo_connections',
        'nfc_connection_log',
      ];

      // Clear user-specific location data if profileId exists
      if (profileId) {
        keys.push(`user_location_${profileId}`);
        keys.push(`proximity_last_checked_${profileId}`);
      }

      // Remove all keys
      await AsyncStorage.multiRemove(keys);

      // Also clear any notification-related keys (notified_*)
      const allKeys = await AsyncStorage.getAllKeys();
      const notificationKeys = allKeys.filter(key => key.startsWith('notified_'));
      if (notificationKeys.length > 0) {
        await AsyncStorage.multiRemove(notificationKeys);
      }

      // Reset app state
      setProfileId(null);
      setHasProfile(false);

      console.log('User signed out successfully');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Show loading screen while initializing
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#1A237E" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          cardStyle: { backgroundColor: '#F5F5F5' },
        }}
      >
        {!hasProfile ? (
          // Show onboarding if no profile exists
          <Stack.Screen name="Onboarding">
            {(props) => (
              <OnboardingScreen
                {...props}
                onComplete={handleOnboardingComplete}
              />
            )}
          </Stack.Screen>
        ) : (
          // Main app screens
          <>
            <Stack.Screen name="Profile">
              {(props) => (
                <ProfileScreen
                  {...props}
                  profileId={profileId!}
                  onNavigateToScan={() =>
                    props.navigation.navigate('Scan', {
                      currentUserId: profileId!,
                    })
                  }
                  onNavigateToQRScan={() =>
                    props.navigation.navigate('QRScan', {
                      currentUserId: profileId!,
                    })
                  }
                  onNavigateToConnections={() =>
                    props.navigation.navigate('Connections', {
                      userId: profileId!,
                    })
                  }
                  onSignOut={handleSignOut}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Scan">
              {(props) => (
                <NFCScanScreen
                  {...props}
                  currentUserId={props.route.params.currentUserId}
                  onProfileScanned={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="QRScan">
              {(props) => (
                <QRScanScreen
                  {...props}
                  currentUserId={props.route.params.currentUserId}
                  onProfileScanned={() => props.navigation.goBack()}
                />
              )}
            </Stack.Screen>
            <Stack.Screen name="Connections">
              {(props) => (
                <ConnectionsScreen
                  {...props}
                  userId={props.route.params.userId}
                />
              )}
            </Stack.Screen>
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
});

