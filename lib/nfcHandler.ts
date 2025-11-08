/**
 * NFC Handler Utilities
 * 
 * Handles NFC read/write operations for profile exchange.
 * Note: NFC only works on real devices, not in Expo Go simulator.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

// Check if running in Expo Go (simulator)
// In Expo Go, Constants.executionEnvironment is 'storeClient'
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Try to import NFC Manager - will fail in Expo Go, that's okay
let NfcManager: any;
let Ndef: any;
let NfcTech: any;
let NfcEvents: any;

try {
  const nfcModule = require('react-native-nfc-manager');
  NfcManager = nfcModule.default;
  Ndef = nfcModule.Ndef;
  NfcTech = nfcModule.NfcTech;
  NfcEvents = nfcModule.NfcEvents;
} catch (error) {
  // NFC Manager not available (e.g., in Expo Go)
  console.log('NFC Manager not available - using simulation mode');
}

/**
 * Initialize NFC Manager
 * Call this when the app starts to enable NFC functionality
 */
export async function initNFC(): Promise<boolean> {
  // In Expo Go or if NFC Manager is not available, use simulation
  if (isExpoGo || !NfcManager) {
    console.log('NFC simulation mode enabled (Expo Go)');
    return true;
  }

  try {
    // Check if NFC is supported on this device
    const supported = await NfcManager.isSupported();
    if (!supported) {
      console.warn('NFC is not supported on this device');
      return false;
    }

    // Start NFC manager
    await NfcManager.start();
    console.log('NFC initialized successfully');
    return true;
  } catch (error) {
    console.error('Error initializing NFC:', error);
    return false;
  }
}

/**
 * Write a profile ID to an NFC tag
 * @param profileId - The UUID of the profile to write to the tag
 * @returns Promise that resolves when write is complete
 */
export async function writeTag(profileId: string): Promise<void> {
  // Simulate NFC write in Expo Go or if NFC Manager is not available
  if (isExpoGo || !NfcManager) {
    console.log('Simulated NFC write:', profileId);
    return Promise.resolve();
  }

  try {
    // Request NDEF technology
    await NfcManager.requestTechnology(NfcTech.Ndef);

    // Encode the profile ID as a text record
    const bytes = Ndef.encodeMessage([Ndef.textRecord(profileId)]);

    // Write the message to the tag
    await NfcManager.writeNdefMessage(bytes);

    console.log('Successfully wrote profile ID to NFC tag:', profileId);
  } catch (error) {
    console.error('Error writing to NFC tag:', error);
    throw error;
  } finally {
    // Always cancel the technology request to release resources
    await NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

/**
 * Read a profile ID from an NFC tag
 * @param onRead - Callback function called when a tag is read, receives the profile ID
 * @returns Promise that resolves when read listener is set up
 */
export async function readTag(onRead: (id: string) => void): Promise<void> {
  // Simulate NFC read in Expo Go or if NFC Manager is not available
  if (isExpoGo || !NfcManager) {
    console.log('📱 Simulated NFC tap - reading profile ID');
    
    // In demo mode, try to get a real profile ID from storage
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const storedProfiles = await AsyncStorage.getItem('demo_profiles');
      if (storedProfiles) {
        const profiles = JSON.parse(storedProfiles);
        if (profiles.length > 0) {
          // Use a random profile or the first one as simulated NFC read
          const randomProfile = profiles[Math.floor(Math.random() * profiles.length)];
          console.log('📱 Simulated NFC: Reading profile', randomProfile.id);
          setTimeout(() => {
            onRead(randomProfile.id);
          }, 2000);
          return Promise.resolve();
        }
      }
    } catch (error) {
      console.log('Error getting demo profiles:', error);
    }
    
    // Fallback: use a demo ID
    setTimeout(() => {
      onRead('demo-nfc-connection');
    }, 2000);
    return Promise.resolve();
  }

  try {
    // Set up event listener for tag discovery
    NfcManager.setEventListener(NfcEvents.DiscoverTag, (tag) => {
      try {
        // Decode the NDEF message payload
        if (tag.ndefMessage && tag.ndefMessage.length > 0) {
          const payload = Ndef.text.decodePayload(tag.ndefMessage[0].payload);
          console.log('NFC tag read:', payload);

          // Call the callback with the profile ID
          onRead(payload);

          // Show alert on iOS
          if (Platform.OS === 'ios') {
            NfcManager.setAlertMessageIOS('Profile detected');
          }

          // Unregister the event listener
          NfcManager.unregisterTagEvent();
        }
      } catch (error) {
        console.error('Error decoding NFC tag:', error);
        NfcManager.unregisterTagEvent();
      }
    });

    // Register for tag events (starts listening)
    await NfcManager.registerTagEvent();
    console.log('NFC read listener active - waiting for tag...');
  } catch (error) {
    console.error('Error setting up NFC read:', error);
    throw error;
  }
}

/**
 * Stop listening for NFC tags
 * Call this when leaving the scan screen to clean up resources
 */
export async function stopReading(): Promise<void> {
  if (isExpoGo || !NfcManager) {
    return Promise.resolve();
  }

  try {
    await NfcManager.unregisterTagEvent();
    console.log('NFC read listener stopped');
  } catch (error) {
    console.error('Error stopping NFC read:', error);
  }
}

/**
 * Check if NFC is available on the current device
 * @returns Promise resolving to true if NFC is supported and enabled
 */
export async function isNFCAvailable(): Promise<boolean> {
  if (isExpoGo || !NfcManager) {
    // In Expo Go, return true so UI works, but it will use simulation
    return true;
  }

  try {
    const supported = await NfcManager.isSupported();
    const enabled = await NfcManager.isEnabled();
    return supported && enabled;
  } catch (error) {
    console.error('Error checking NFC availability:', error);
    return false;
  }
}

