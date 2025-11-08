/**
 * ProfileCard Component
 * 
 * Displays a user's profile information in a card format.
 * Used throughout the app to show profile details.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Profile } from '../lib/supabaseClient';

interface ProfileCardProps {
  profile: Profile;
  editable?: boolean;
  onEdit?: () => void;
}

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  editable = false,
  onEdit,
}) => {
  return (
    <Card style={styles.card} onPress={editable ? onEdit : undefined}>
      <Card.Content>
        <Title style={styles.name}>{profile.name || 'Anonymous'}</Title>
        
        {profile.major && (
          <Paragraph style={styles.major}>📚 {profile.major}</Paragraph>
        )}

        {profile.bio && (
          <Paragraph style={styles.bio}>{profile.bio}</Paragraph>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            <Text style={styles.interestsLabel}>Interests:</Text>
            <View style={styles.interestsList}>
              {profile.interests.map((interest, index) => (
                <View key={index} style={styles.interestTag}>
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 8,
  },
  major: {
    fontSize: 16,
    color: '#4DB6AC',
    marginBottom: 12,
    fontWeight: '600',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  interestsContainer: {
    marginTop: 8,
  },
  interestsLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 8,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 12,
    color: '#1A237E',
    fontWeight: '500',
  },
});

