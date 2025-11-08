/**
 * NFCScanScreen
 * 
 * Listens for NFC tags and fetches the associated profile.
 * Creates a connection when a profile is successfully read.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Button } from 'react-native-paper';
import { ProfileCard } from '../components/ProfileCard';
import { readTag, stopReading, isNFCAvailable } from '../lib/nfcHandler';
import {
  getProfileById,
  createConnection,
  Profile,
} from '../lib/supabaseClient';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NFCScanScreenProps {
  currentUserId: string;
  onProfileScanned: () => void;
}

export const NFCScanScreen: React.FC<NFCScanScreenProps> = ({
  currentUserId,
  onProfileScanned,
}) => {
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<Profile | null>(null);
  const [nfcAvailable, setNfcAvailable] = useState<boolean | null>(null);

  /**
   * Check NFC availability on mount
   */
  useEffect(() => {
    checkNFCAvailability();
    return () => {
      // Clean up NFC listener when component unmounts
      stopReading();
    };
  }, []);

  /**
   * Check if NFC is available on this device
   */
  const checkNFCAvailability = async () => {
    const available = await isNFCAvailable();
    setNfcAvailable(available);
  };

  /**
   * Start scanning for NFC tags
   */
  const startScanning = async () => {
    if (!nfcAvailable) {
      Alert.alert(
        'NFC Not Available',
        'NFC is not supported or enabled on this device. Please enable NFC in your device settings.'
      );
      return;
    }

    setScanning(true);
    setScannedProfile(null);

    try {
      await readTag(async (profileId) => {
        setScanning(false);
        setLoading(true);

        try {
          // Fetch the profile from Supabase
          let profile = await getProfileById(profileId);

          // If profile not found and it's a demo ID, try to find another profile
          if (!profile && profileId.startsWith('demo-')) {
            const AsyncStorage = require('@react-native-async-storage/async-storage').default;
            const storedProfiles = await AsyncStorage.getItem('demo_profiles');
            if (storedProfiles) {
              const profiles = JSON.parse(storedProfiles);
              if (profiles.length > 0) {
                // Use a different profile than current user (by ID and name)
                const otherProfiles = profiles.filter((p: Profile) => 
                  p.id !== currentUserId && 
                  p.name !== null
                );
                if (otherProfiles.length > 0) {
                  // Get current user's profile to compare names
                  const currentUserProfile = await getProfileById(currentUserId);
                  const differentNameProfiles = currentUserProfile 
                    ? otherProfiles.filter((p: Profile) => p.name !== currentUserProfile.name)
                    : otherProfiles;
                  
                  if (differentNameProfiles.length > 0) {
                    profile = differentNameProfiles[0];
                    console.log('📱 Using demo profile for NFC connection:', profile.id, profile.name);
                  } else if (otherProfiles.length > 0) {
                    profile = otherProfiles[0];
                    console.log('📱 Using demo profile for NFC connection:', profile.id);
                  }
                }
              }
            }
          }

          if (!profile) {
            Alert.alert('Error', 'Profile not found. Make sure you have created at least one profile.');
            setLoading(false);
            return;
          }

          // Don't allow connecting to yourself - check by ID and name
          if (profile.id === currentUserId) {
            Alert.alert('Info', "You can't connect to yourself!");
            setLoading(false);
            return;
          }
          
          // Also check by name to prevent connecting to same person
          const currentUserProfile = await getProfileById(currentUserId);
          if (currentUserProfile && profile.name && currentUserProfile.name === profile.name) {
            Alert.alert('Info', "You can't connect to yourself!");
            setLoading(false);
            return;
          }

          // Create connection in database
          await createConnection(currentUserId, profile.id);

          // Send notification about the connection
          try {
            await Notifications.scheduleNotificationAsync({
              content: {
                title: '🎉 New Connection!',
                body: `You've connected with ${profile.name || 'a new user'}!`,
                data: { userId: profile.id, type: 'nfc_connection' },
                sound: true,
              },
              trigger: null, // Send immediately
            });
          } catch (notifError) {
            console.log('Notification error:', notifError);
          }

          setScannedProfile(profile);
          Alert.alert('Success', `Connected with ${profile.name || 'User'}!`);
          onProfileScanned();
        } catch (error) {
          console.error('Error processing scanned profile:', error);
          Alert.alert('Error', 'Failed to process scanned profile');
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Error starting NFC scan:', error);
      Alert.alert('Error', 'Failed to start NFC scan');
      setScanning(false);
    }
  };

  /**
   * Stop scanning for NFC tags
   */
  const stopScanning = async () => {
    await stopReading();
    setScanning(false);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan NFC Tag</Text>
        <Text style={styles.subtitle}>
          Tap your phone to an NFC tag to connect with another student
        </Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContent}>
            <ActivityIndicator size="large" color="#1A237E" />
            <Text style={styles.loadingText}>Processing profile...</Text>
          </View>
        ) : scanning ? (
          <View style={styles.centerContent}>
            <Text style={styles.scanningText}>📱 Scanning...</Text>
            <Text style={styles.scanningSubtext}>
              Hold your phone near an NFC tag
            </Text>
            <Button
              mode="outlined"
              onPress={stopScanning}
              style={styles.stopButton}
              textColor="#FF0000"
            >
              Stop Scanning
            </Button>
          </View>
        ) : scannedProfile ? (
          <View style={styles.profileContainer}>
            <Text style={styles.successText}>✓ Connection Successful!</Text>
            <ProfileCard profile={scannedProfile} />
            <Button
              mode="contained"
              onPress={startScanning}
              style={styles.button}
              buttonColor="#1A237E"
              textColor="#FFFFFF"
            >
              Scan Another Tag
            </Button>
          </View>
        ) : (
          <View style={styles.centerContent}>
            <Text style={styles.instructionText}>
              {nfcAvailable === false
                ? 'NFC is not available on this device'
                : 'Ready to scan'}
            </Text>
            <Button
              mode="contained"
              onPress={startScanning}
              disabled={nfcAvailable === false}
              style={styles.button}
              buttonColor="#1A237E"
              textColor="#FFFFFF"
            >
              Start Scanning
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#1A237E',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanningText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 12,
  },
  scanningSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  instructionText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  button: {
    marginTop: 16,
    paddingVertical: 6,
    minWidth: 200,
  },
  stopButton: {
    marginTop: 24,
    paddingVertical: 6,
  },
  profileContainer: {
    flex: 1,
  },
  successText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4DB6AC',
    textAlign: 'center',
    marginBottom: 16,
  },
});

