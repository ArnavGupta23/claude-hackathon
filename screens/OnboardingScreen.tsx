/**
 * OnboardingScreen
 * 
 * First screen shown to new users.
 * Collects name, major, interests, and bio to create their profile.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { TextInput, Button } from 'react-native-paper';
import { createProfile } from '../lib/supabaseClient';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingScreenProps {
  onComplete: (profileId: string) => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [name, setName] = useState('');
  const [major, setMajor] = useState('');
  const [interests, setInterests] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * Handle profile creation
   * Validates input and creates profile in Supabase
   */
  const handleCreateProfile = async () => {
    // Validate required fields
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!major.trim()) {
      Alert.alert('Error', 'Please enter your major');
      return;
    }

    // Parse interests (comma-separated)
    const interestsArray = interests
      .split(',')
      .map((i) => i.trim())
      .filter((i) => i.length > 0);

    if (interestsArray.length < 2) {
      Alert.alert('Error', 'Please add at least 2 interests to help find matches!');
      return;
    }

    setLoading(true);
    try {
      // Create profile in Supabase
      const profile = await createProfile({
        name: name.trim(),
        major: major.trim(),
        interests: interestsArray,
        bio: bio.trim() || null,
      });

      // Store profile ID locally for future use
      await AsyncStorage.setItem('userProfileId', profile.id);

      // Navigate to profile screen
      onComplete(profile.id);
    } catch (error) {
      console.error('Error creating profile:', error);
      Alert.alert(
        'Error',
        'Failed to create profile. Please check your Supabase configuration.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Welcome to LinkUp! 👋</Text>
          <Text style={styles.subtitle}>
            Create your profile to start networking with other students
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Name *"
            value={name}
            onChangeText={setName}
            mode="outlined"
            style={styles.input}
            placeholder="Enter your name"
          />

          <TextInput
            label="Major *"
            value={major}
            onChangeText={setMajor}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., Computer Science"
          />

          <TextInput
            label="Interests *"
            value={interests}
            onChangeText={setInterests}
            mode="outlined"
            style={styles.input}
            placeholder="e.g., AI, Music, Basketball, Photography (comma-separated)"
            multiline
            helperText="Add at least 3-4 interests to find better matches!"
          />

          <TextInput
            label="Bio"
            value={bio}
            onChangeText={setBio}
            mode="outlined"
            style={styles.input}
            placeholder="Tell us about yourself..."
            multiline
            numberOfLines={4}
          />

          <Button
            mode="contained"
            onPress={handleCreateProfile}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#1A237E"
            textColor="#FFFFFF"
          >
            Create Profile
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  form: {
    width: '100%',
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    marginTop: 8,
    paddingVertical: 6,
  },
});

