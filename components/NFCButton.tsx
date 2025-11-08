/**
 * NFCButton Component
 * 
 * A button component for triggering NFC write operations.
 * Shows loading state during NFC operations.
 */

import React, { useState } from 'react';
import { StyleSheet, Alert } from 'react-native';
import { Button } from 'react-native-paper';
import { writeTag } from '../lib/nfcHandler';

interface NFCButtonProps {
  profileId: string;
  label?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export const NFCButton: React.FC<NFCButtonProps> = ({
  profileId,
  label = 'Write NFC Tag',
  onSuccess,
  onError,
}) => {
  const [loading, setLoading] = useState(false);

  /**
   * Handle NFC write operation
   */
  const handleWrite = async () => {
    if (!profileId) {
      Alert.alert('Error', 'No profile ID available');
      return;
    }

    setLoading(true);
    try {
      await writeTag(profileId);
      Alert.alert('Success', 'Profile written to NFC tag!');
      onSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to write NFC tag';
      Alert.alert('Error', errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      mode="contained"
      onPress={handleWrite}
      loading={loading}
      disabled={loading}
      style={styles.button}
      buttonColor="#1A237E"
      textColor="#FFFFFF"
    >
      {label}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
    paddingVertical: 4,
  },
});

