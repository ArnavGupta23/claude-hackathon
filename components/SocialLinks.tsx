/**
 * SocialLinks Component
 *
 * Displays and manages social media links for a profile.
 * Supports LinkedIn, Instagram, Twitter, GitHub, Email, and Phone.
 */

import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Linking, TouchableOpacity, Alert } from 'react-native';
import { Button } from 'react-native-paper';

interface SocialLinksProps {
  linkedin?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  github?: string | null;
  email?: string | null;
  phone?: string | null;
  editable?: boolean;
  onSave?: (links: SocialLinksData) => void;
}

export interface SocialLinksData {
  linkedin?: string | null;
  instagram?: string | null;
  twitter?: string | null;
  github?: string | null;
  email?: string | null;
  phone?: string | null;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  linkedin = null,
  instagram = null,
  twitter = null,
  github = null,
  email = null,
  phone = null,
  editable = false,
  onSave,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedLinks, setEditedLinks] = useState<SocialLinksData>({
    linkedin,
    instagram,
    twitter,
    github,
    email,
    phone,
  });

  const handleSave = () => {
    if (onSave) {
      onSave(editedLinks);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedLinks({ linkedin, instagram, twitter, github, email, phone });
    setIsEditing(false);
  };

  const openLink = (url: string | null | undefined, type: string) => {
    if (!url) return;

    let fullUrl = url;

    // Add appropriate prefix based on type
    if (type === 'email' && !url.startsWith('mailto:')) {
      fullUrl = `mailto:${url}`;
    } else if (type === 'phone' && !url.startsWith('tel:')) {
      fullUrl = `tel:${url}`;
    } else if (type === 'linkedin' && !url.startsWith('http')) {
      fullUrl = `https://linkedin.com/in/${url}`;
    } else if (type === 'instagram' && !url.startsWith('http')) {
      fullUrl = `https://instagram.com/${url}`;
    } else if (type === 'twitter' && !url.startsWith('http')) {
      fullUrl = `https://twitter.com/${url}`;
    } else if (type === 'github' && !url.startsWith('http')) {
      fullUrl = `https://github.com/${url}`;
    }

    Linking.openURL(fullUrl).catch(() => {
      Alert.alert('Error', 'Could not open link');
    });
  };

  const socialMediaConfig = [
    { key: 'linkedin', label: 'LinkedIn', icon: '💼', placeholder: 'username or profile URL' },
    { key: 'github', label: 'GitHub', icon: '💻', placeholder: 'username or profile URL' },
    { key: 'instagram', label: 'Instagram', icon: '📷', placeholder: '@username or URL' },
    { key: 'twitter', label: 'Twitter', icon: '🐦', placeholder: '@username or URL' },
    { key: 'email', label: 'Email', icon: '📧', placeholder: 'email@example.com' },
    { key: 'phone', label: 'Phone', icon: '📱', placeholder: '+1234567890' },
  ];

  const hasAnyLinks = linkedin || instagram || twitter || github || email || phone;

  if (!editable && !isEditing && !hasAnyLinks) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Contact & Social</Text>
        {editable && !isEditing && (
          <Button
            mode="text"
            onPress={() => setIsEditing(true)}
            textColor="#4DB6AC"
            compact
          >
            Edit
          </Button>
        )}
      </View>

      {isEditing ? (
        <View style={styles.editContainer}>
          {socialMediaConfig.map((social) => (
            <View key={social.key} style={styles.inputGroup}>
              <Text style={styles.inputLabel}>
                {social.icon} {social.label}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={social.placeholder}
                value={editedLinks[social.key as keyof SocialLinksData] || ''}
                onChangeText={(text) =>
                  setEditedLinks({ ...editedLinks, [social.key]: text })
                }
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType={social.key === 'email' ? 'email-address' : social.key === 'phone' ? 'phone-pad' : 'default'}
                placeholderTextColor="#999"
              />
            </View>
          ))}

          <View style={styles.editButtons}>
            <Button
              mode="outlined"
              onPress={handleCancel}
              style={styles.editButton}
              textColor="#666"
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSave}
              style={styles.editButton}
              buttonColor="#4DB6AC"
              textColor="#FFFFFF"
            >
              Save
            </Button>
          </View>
        </View>
      ) : (
        <View style={styles.linksContainer}>
          {socialMediaConfig.map((social) => {
            const value = {linkedin, instagram, twitter, github, email, phone}[social.key as keyof SocialLinksData];
            if (!value) return null;

            return (
              <TouchableOpacity
                key={social.key}
                style={styles.linkButton}
                onPress={() => openLink(value, social.key)}
              >
                <Text style={styles.linkIcon}>{social.icon}</Text>
                <View style={styles.linkContent}>
                  <Text style={styles.linkLabel}>{social.label}</Text>
                  <Text style={styles.linkValue} numberOfLines={1}>
                    {value}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A237E',
  },
  editContainer: {
    gap: 12,
  },
  inputGroup: {
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1A237E',
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
  },
  editButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  editButton: {
    minWidth: 80,
  },
  linksContainer: {
    gap: 8,
  },
  linkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  linkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  linkContent: {
    flex: 1,
  },
  linkLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 2,
  },
  linkValue: {
    fontSize: 14,
    color: '#1A237E',
    fontWeight: '500',
  },
});
