/**
 * ProfileScreen
 * 
 * Displays the user's own profile with edit capabilities.
 * Includes button to write profile to NFC tag.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { Button } from 'react-native-paper';
import { ProfileCard } from '../components/ProfileCard';
import { NFCButton } from '../components/NFCButton';
import { QRCodeDisplay } from '../components/QRCodeDisplay';
import { InterestManager } from '../components/InterestManager';
import { SocialLinks, SocialLinksData } from '../components/SocialLinks';
import { ProfileStats } from '../components/ProfileStats';
import {
  getProfileById,
  updateProfile,
  Profile,
  getUserConnections,
} from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ProfileScreenProps {
  profileId: string;
  onNavigateToScan: () => void;
  onNavigateToQRScan: () => void;
  onNavigateToConnections: () => void;
  onSignOut: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profileId,
  onNavigateToScan,
  onNavigateToQRScan,
  onNavigateToConnections,
  onSignOut,
}) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditingInterests, setIsEditingInterests] = useState(false);
  const [editedInterests, setEditedInterests] = useState<string[]>([]);
  const [connectionCount, setConnectionCount] = useState(0);

  /**
   * Load user profile from Supabase
   */
  const loadProfile = async () => {
    try {
      console.log('Loading profile with ID:', profileId);
      const data = await getProfileById(profileId);
      console.log('Profile loaded:', data ? 'Found' : 'Not found');
      
      if (!data) {
        // In demo mode, try to get the most recent profile
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const storedProfiles = await AsyncStorage.getItem('demo_profiles');
          if (storedProfiles) {
            const profiles = JSON.parse(storedProfiles);
            if (profiles.length > 0) {
              // Get the most recent profile
              const recentProfile = profiles[profiles.length - 1];
              console.log('Using most recent profile:', recentProfile.id);
              setProfile(recentProfile);
              // Update stored profile ID
              await AsyncStorage.setItem('userProfileId', recentProfile.id);
              setLoading(false);
              setRefreshing(false);
              return;
            }
          }
        } catch (storageError) {
          console.error('Error checking storage:', storageError);
        }
      }
      
      setProfile(data);

      // Load connection count
      if (data) {
        try {
          const connections = await getUserConnections(data.id);
          setConnectionCount(connections.length);
        } catch (connError) {
          console.error('Error loading connections:', connError);
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [profileId]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadProfile();
  };

  /**
   * Handle sign out with confirmation
   */
  const handleSignOutPress = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? This will clear all your local data.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: onSignOut,
        },
      ]
    );
  };

  /**
   * Start editing interests
   */
  const handleStartEditInterests = () => {
    setEditedInterests(profile?.interests || []);
    setIsEditingInterests(true);
  };

  /**
   * Save updated interests to profile
   */
  const handleSaveInterests = async () => {
    if (!profile) return;

    try {
      await updateProfile(profile.id, { interests: editedInterests } as any);
      setProfile({ ...profile, interests: editedInterests });
      setIsEditingInterests(false);
      Alert.alert('Success', 'Your interests have been updated!');
    } catch (error) {
      console.error('Error updating interests:', error);
      Alert.alert('Error', 'Failed to update interests. Please try again.');
    }
  };

  /**
   * Cancel editing interests
   */
  const handleCancelEditInterests = () => {
    setEditedInterests([]);
    setIsEditingInterests(false);
  };

  /**
   * Save social media links
   */
  const handleSaveSocialLinks = async (links: SocialLinksData) => {
    if (!profile) return;

    try {
      await updateProfile(profile.id, links as any);
      setProfile({ ...profile, ...links });
      Alert.alert('Success', 'Your social links have been updated!');
    } catch (error) {
      console.error('Error updating social links:', error);
      Alert.alert('Error', 'Failed to update social links. Please try again.');
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Profile not found</Text>
          <Text style={styles.errorSubtext}>
            Profile ID: {profileId}
          </Text>
          <Button 
            mode="contained" 
            onPress={loadProfile}
            style={styles.retryButton}
            buttonColor="#1A237E"
          >
            Retry
          </Button>
          <Button 
            mode="outlined" 
            onPress={async () => {
              // Clear stored profile and go back to onboarding
              const AsyncStorage = require('@react-native-async-storage/async-storage').default;
              await AsyncStorage.removeItem('userProfileId');
              // Force app reload by showing onboarding
              Alert.alert('Info', 'Please restart the app to create a new profile');
            }}
            style={styles.retryButton}
          >
            Create New Profile
          </Button>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Profile</Text>
        </View>

        <ProfileCard profile={profile} editable={false} />

        {/* Profile Statistics */}
        <View style={styles.statsSection}>
          <ProfileStats
            connectionCount={connectionCount}
            dateJoined={profile.created_at}
            lastActive={profile.last_seen}
          />
        </View>

        {/* Social Links Section */}
        <View style={styles.socialSection}>
          <SocialLinks
            linkedin={profile.linkedin}
            instagram={profile.instagram}
            twitter={profile.twitter}
            github={profile.github}
            email={profile.email}
            phone={profile.phone}
            editable={true}
            onSave={handleSaveSocialLinks}
          />
        </View>

        {/* Interest Management Section */}
        <View style={styles.interestsSection}>
          <View style={styles.interestsSectionHeader}>
            <Text style={styles.interestsSectionTitle}>
              {isEditingInterests ? 'Edit Interests' : 'Your Interests'}
            </Text>
            {!isEditingInterests && (
              <Button
                mode="text"
                onPress={handleStartEditInterests}
                textColor="#4DB6AC"
                compact
              >
                Edit
              </Button>
            )}
          </View>

          <InterestManager
            interests={isEditingInterests ? editedInterests : profile.interests || []}
            onInterestsChange={setEditedInterests}
            editable={isEditingInterests}
          />

          {isEditingInterests && (
            <View style={styles.editButtons}>
              <Button
                mode="outlined"
                onPress={handleCancelEditInterests}
                style={styles.editButton}
                textColor="#666"
              >
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleSaveInterests}
                style={styles.editButton}
                buttonColor="#4DB6AC"
                textColor="#FFFFFF"
              >
                Save
              </Button>
            </View>
          )}
        </View>

        <View style={styles.qrSection}>
          <Text style={styles.qrSectionTitle}>Share Your Profile</Text>
          <QRCodeDisplay profileId={profile.id} size={180} />
        </View>

        <View style={styles.buttonContainer}>
          <NFCButton
            profileId={profile.id}
            label="📱 Write to NFC Tag"
            onSuccess={() => {
              Alert.alert('Success', 'Your profile is now on the NFC tag!');
            }}
          />

          <Button
            mode="contained"
            onPress={onNavigateToQRScan}
            style={styles.button}
            buttonColor="#4DB6AC"
            textColor="#FFFFFF"
          >
            📷 Scan QR Code
          </Button>

          <Button
            mode="outlined"
            onPress={onNavigateToScan}
            style={styles.button}
            textColor="#1A237E"
          >
            🔍 Scan NFC Tag
          </Button>

          <Button
            mode="outlined"
            onPress={onNavigateToConnections}
            style={styles.button}
            textColor="#1A237E"
          >
            👥 My Connections
          </Button>

          <Button
            mode="outlined"
            onPress={handleSignOutPress}
            style={[styles.button, styles.signOutButton]}
            textColor="#D32F2F"
          >
            Sign Out
          </Button>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
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
  },
  qrSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  qrSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 12,
  },
  buttonContainer: {
    padding: 16,
    gap: 12,
  },
  button: {
    marginVertical: 4,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF0000',
    marginBottom: 8,
  },
  errorSubtext: {
    textAlign: 'center',
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    marginTop: 12,
    minWidth: 200,
  },
  signOutButton: {
    marginTop: 16,
    borderColor: '#D32F2F',
  },
  interestsSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  interestsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  interestsSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A237E',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  editButton: {
    minWidth: 80,
  },
  statsSection: {
    margin: 16,
    marginTop: 0,
  },
  socialSection: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
});

