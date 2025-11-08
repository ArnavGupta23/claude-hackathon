/**
 * ProfileStats Component
 *
 * Displays statistics about a user's profile including:
 * - Total connections
 * - Date joined
 * - Last active
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProfileStatsProps {
  connectionCount: number;
  dateJoined: string;
  lastActive?: string | null;
}

export const ProfileStats: React.FC<ProfileStatsProps> = ({
  connectionCount,
  dateJoined,
  lastActive,
}) => {
  /**
   * Format date to relative time (e.g., "2 days ago")
   */
  const formatRelativeTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    const diffMonths = Math.floor(diffDays / 30);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 30) return `${diffDays}d ago`;
    if (diffMonths < 12) return `${diffMonths}mo ago`;
    return date.toLocaleDateString();
  };

  /**
   * Format date to readable format (e.g., "Jan 2024")
   */
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.statItem}>
        <Text style={styles.statValue}>{connectionCount}</Text>
        <Text style={styles.statLabel}>
          {connectionCount === 1 ? 'Connection' : 'Connections'}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.statItem}>
        <Text style={styles.statValue}>{formatDate(dateJoined)}</Text>
        <Text style={styles.statLabel}>Joined</Text>
      </View>

      {lastActive && (
        <>
          <View style={styles.divider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatRelativeTime(lastActive)}</Text>
            <Text style={styles.statLabel}>Last Active</Text>
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1A237E',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E0E0E0',
  },
});
