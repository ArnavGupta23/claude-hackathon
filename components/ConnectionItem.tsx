/**
 * ConnectionItem Component
 * 
 * Displays a single connection in the connections list.
 * Shows the connected user's profile and connection date.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { Profile } from '../lib/supabaseClient';

interface ConnectionItemProps {
  profile: Profile | null;
  connectedAt: string;
}

export const ConnectionItem: React.FC<ConnectionItemProps> = ({
  profile,
  connectedAt,
}) => {
  if (!profile) {
    return (
      <Card style={styles.card}>
        <Card.Content>
          <Text style={styles.errorText}>Profile not found</Text>
        </Card.Content>
      </Card>
    );
  }

  // Format the connection date
  const date = new Date(connectedAt);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <Title style={styles.name}>{profile.name || 'Anonymous'}</Title>
          <Text style={styles.date}>{formattedDate}</Text>
        </View>

        {profile.major && (
          <Paragraph style={styles.major}>📚 {profile.major}</Paragraph>
        )}

        {profile.interests && profile.interests.length > 0 && (
          <View style={styles.interestsContainer}>
            {profile.interests.slice(0, 3).map((interest, index) => (
              <View key={index} style={styles.interestTag}>
                <Text style={styles.interestText}>{interest}</Text>
              </View>
            ))}
            {profile.interests.length > 3 && (
              <Text style={styles.moreInterests}>
                +{profile.interests.length - 3} more
              </Text>
            )}
          </View>
        )}
      </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A237E',
    flex: 1,
  },
  date: {
    fontSize: 12,
    color: '#999',
  },
  major: {
    fontSize: 14,
    color: '#4DB6AC',
    marginBottom: 8,
    fontWeight: '500',
  },
  interestsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  interestTag: {
    backgroundColor: '#E0F2F1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  interestText: {
    fontSize: 11,
    color: '#1A237E',
    fontWeight: '500',
  },
  moreInterests: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
  },
  errorText: {
    color: '#999',
    fontStyle: 'italic',
  },
});

