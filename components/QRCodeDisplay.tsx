/**
 * QRCodeDisplay Component
 * 
 * Displays a QR code for profile sharing.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { generateProfileQRData } from '../lib/qrHandler';

interface QRCodeDisplayProps {
  profileId: string;
  size?: number;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  profileId,
  size = 200,
}) => {
  const qrData = generateProfileQRData(profileId);

  return (
    <View style={styles.container}>
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={size}
          color="#1A237E"
          backgroundColor="#FFFFFF"
        />
      </View>
      <Text style={styles.instructionText}>
        Scan this QR code to connect!
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 20,
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});

