/**
 * ConnectionsScreen
 * 
 * Displays a list of all connections the user has made.
 * Shows profile cards for each connected user.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { ConnectionItem } from '../components/ConnectionItem';
import { getUserConnections, Profile } from '../lib/supabaseClient';

interface ConnectionWithProfile {
  id: number;
  user_a: string;
  user_b: string;
  connected_at: string;
  profile: Profile | null;
}

interface ConnectionsScreenProps {
  userId: string;
}

export const ConnectionsScreen: React.FC<ConnectionsScreenProps> = ({
  userId,
}) => {
  const [connections, setConnections] = useState<ConnectionWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Load user connections from Supabase
   */
  const loadConnections = async () => {
    try {
      const data = await getUserConnections(userId);
      setConnections(data);
    } catch (error) {
      console.error('Error loading connections:', error);
      Alert.alert('Error', 'Failed to load connections');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadConnections();
  }, [userId]);

  /**
   * Handle pull-to-refresh
   */
  const onRefresh = () => {
    setRefreshing(true);
    loadConnections();
  };

  /**
   * Render a connection item
   */
  const renderConnection = ({ item }: { item: ConnectionWithProfile }) => (
    <ConnectionItem
      profile={item.profile}
      connectedAt={item.connected_at}
    />
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>My Connections</Text>
        </View>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading connections...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Connections</Text>
        <Text style={styles.subtitle}>
          {connections.length} {connections.length === 1 ? 'connection' : 'connections'}
        </Text>
      </View>

      {connections.length === 0 ? (
        <View style={styles.centerContent}>
          <Text style={styles.emptyText}>No connections yet</Text>
          <Text style={styles.emptySubtext}>
            Start scanning NFC tags to make connections!
          </Text>
        </View>
      ) : (
        <FlatList
          data={connections}
          renderItem={renderConnection}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  listContent: {
    paddingVertical: 8,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

