/**
 * QRScanScreen
 * 
 * Scans QR codes to connect with other users.
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
// Try to import barcode scanner - may not be available in Expo Go
let BarCodeScanner: any;
try {
  BarCodeScanner = require('expo-barcode-scanner');
} catch (error) {
  console.log('Barcode scanner not available in Expo Go');
  BarCodeScanner = null;
}
import { ProfileCard } from '../components/ProfileCard';
import { parseProfileQRData } from '../lib/qrHandler';
import {
  getProfileById,
  createConnection,
  Profile,
} from '../lib/supabaseClient';
import * as Notifications from 'expo-notifications';

interface QRScanScreenProps {
  currentUserId: string;
  onProfileScanned: () => void;
}

export const QRScanScreen: React.FC<QRScanScreenProps> = ({
  currentUserId,
  onProfileScanned,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [scannedProfile, setScannedProfile] = useState<Profile | null>(null);

  /**
   * Request camera permission
   */
  useEffect(() => {
    (async () => {
      if (!BarCodeScanner) {
        setHasPermission(false);
        return;
      }
      try {
        const { status } = await BarCodeScanner.requestPermissionsAsync();
        setHasPermission(status === 'granted');
      } catch (error) {
        console.error('Error requesting camera permission:', error);
        setHasPermission(false);
      }
    })();
  }, []);

  /**
   * Handle QR code scan
   */
  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (scanned) return;

    setScanned(true);
    setLoading(true);

    try {
      // Parse profile ID from QR code
      const profileId = parseProfileQRData(data);

      if (!profileId) {
        Alert.alert('Error', 'Invalid QR code. Please scan a LinkUp profile QR code.');
        setLoading(false);
        return;
      }

      // Fetch the profile from Supabase
      const profile = await getProfileById(profileId);

      if (!profile) {
        Alert.alert('Error', 'Profile not found');
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
            body: `You've connected with ${profile.name || 'a new user'} via QR code!`,
            data: { userId: profile.id, type: 'qr_connection' },
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
      console.error('Error processing scanned QR code:', error);
      Alert.alert('Error', 'Failed to process scanned QR code');
    } finally {
      setLoading(false);
    }
  };

  // If barcode scanner is not available, show fallback
  if (!BarCodeScanner) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Scan QR Code</Text>
          <Text style={styles.subtitle}>
            Manual entry mode (QR scanner requires development build)
          </Text>
        </View>
        <View style={styles.fallbackContainer}>
          <Text style={styles.fallbackText}>
            📷 QR Scanner not available in Expo Go
          </Text>
          <Text style={styles.fallbackSubtext}>
            You can manually enter a profile ID to test connections
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              // Use a simple text input approach
              Alert.prompt(
                'Enter Profile ID',
                'Enter a profile ID or QR code data (linkup://profile/...)',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Connect',
                    onPress: async (input) => {
                      if (input) {
                        handleBarCodeScanned({ data: input });
                      }
                    },
                  },
                ],
                'plain-text'
              );
            }}
            style={styles.button}
            buttonColor="#1A237E"
          >
            Enter Profile ID Manually
          </Button>
        </View>
      </View>
    );
  }

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required to scan QR codes</Text>
          <Button
            mode="contained"
            onPress={async () => {
              if (!BarCodeScanner) {
                Alert.alert('Error', 'Barcode scanner not available in Expo Go. Use manual entry instead.');
                return;
              }
              try {
                const { status } = await BarCodeScanner.requestPermissionsAsync();
                setHasPermission(status === 'granted');
              } catch (error) {
                Alert.alert('Error', 'Camera permission not available.');
              }
            }}
            style={styles.button}
          >
            Grant Permission
          </Button>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#1A237E" />
        <Text style={styles.loadingText}>Processing profile...</Text>
      </View>
    );
  }

  if (scannedProfile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Connection Successful! ✓</Text>
        </View>
        <ProfileCard profile={scannedProfile} />
        <Button
          mode="contained"
          onPress={() => {
            setScanned(false);
            setScannedProfile(null);
          }}
          style={styles.button}
          buttonColor="#1A237E"
        >
          Scan Another QR Code
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan QR Code</Text>
        <Text style={styles.subtitle}>
          Point your camera at a LinkUp profile QR code
        </Text>
      </View>

      <View style={styles.scannerContainer}>
        <BarCodeScanner.BarCodeScanner
          onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
          style={StyleSheet.absoluteFillObject}
        />
        <View style={styles.overlay}>
          <View style={styles.scanArea} />
        </View>
      </View>

      {scanned && (
        <Button
          mode="outlined"
          onPress={() => setScanned(false)}
          style={styles.button}
        >
          Tap to Scan Again
        </Button>
      )}
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
  scannerContainer: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanArea: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#4DB6AC',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  text: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  errorText: {
    fontSize: 16,
    color: '#FF0000',
    textAlign: 'center',
    marginTop: 50,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    textAlign: 'center',
  },
  button: {
    margin: 20,
    paddingVertical: 6,
  },
  fallbackContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#1A1A1A',
  },
  fallbackText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  fallbackSubtext: {
    fontSize: 14,
    color: '#999',
    marginBottom: 24,
    textAlign: 'center',
  },
});

