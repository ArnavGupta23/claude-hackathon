/**
 * InterestManager Component
 *
 * Allows users to add and remove interests from their profile.
 * Displays interests as tags with remove buttons.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Button, IconButton } from 'react-native-paper';

interface InterestManagerProps {
  interests: string[];
  onInterestsChange: (newInterests: string[]) => void;
  editable?: boolean;
}

export const InterestManager: React.FC<InterestManagerProps> = ({
  interests,
  onInterestsChange,
  editable = true,
}) => {
  const [newInterest, setNewInterest] = useState('');

  /**
   * Add a new interest to the list
   */
  const handleAddInterest = () => {
    const trimmed = newInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      onInterestsChange([...interests, trimmed]);
      setNewInterest('');
    }
  };

  /**
   * Remove an interest from the list
   */
  const handleRemoveInterest = (index: number) => {
    const updated = interests.filter((_, i) => i !== index);
    onInterestsChange(updated);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Interests</Text>

      {/* Display current interests */}
      {interests.length > 0 && (
        <View style={styles.interestsList}>
          {interests.map((interest, index) => (
            <View key={index} style={styles.interestTag}>
              <Text style={styles.interestText}>{interest}</Text>
              {editable && (
                <TouchableOpacity
                  onPress={() => handleRemoveInterest(index)}
                  style={styles.removeButton}
                >
                  <Text style={styles.removeButtonText}>×</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Add new interest input */}
      {editable && (
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add an interest (e.g., Basketball, Coding)"
            value={newInterest}
            onChangeText={setNewInterest}
            onSubmitEditing={handleAddInterest}
            returnKeyType="done"
            placeholderTextColor="#999"
          />
          <Button
            mode="contained"
            onPress={handleAddInterest}
            style={styles.addButton}
            buttonColor="#4DB6AC"
            textColor="#FFFFFF"
            disabled={!newInterest.trim()}
          >
            Add
          </Button>
        </View>
      )}

      {interests.length === 0 && !editable && (
        <Text style={styles.emptyText}>No interests added yet</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
    marginBottom: 12,
  },
  interestsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  interestTag: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E0F2F1',
    paddingLeft: 12,
    paddingRight: 4,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  interestText: {
    fontSize: 14,
    color: '#1A237E',
    fontWeight: '500',
    textAlign: 'center',
  },
  removeButton: {
    marginLeft: 4,
    paddingHorizontal: 6,
  },
  removeButtonText: {
    fontSize: 20,
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  addButton: {
    borderRadius: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});
