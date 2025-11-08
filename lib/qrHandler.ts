/**
 * QR Code Handler
 * 
 * Handles QR code generation and scanning for profile sharing.
 */

/**
 * Generate a QR code data string for a profile
 * @param profileId - The UUID of the profile
 * @returns QR code data string
 */
export function generateProfileQRData(profileId: string): string {
  // Format: linkup://profile/{profileId}
  return `linkup://profile/${profileId}`;
}

/**
 * Parse profile ID from QR code data
 * @param qrData - The scanned QR code data
 * @returns Profile ID or null if invalid
 */
export function parseProfileQRData(qrData: string): string | null {
  try {
    // Check if it's a LinkUp QR code
    if (qrData.startsWith('linkup://profile/')) {
      return qrData.replace('linkup://profile/', '');
    }
    // Also support direct UUID format
    if (qrData.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return qrData;
    }
    return null;
  } catch (error) {
    console.error('Error parsing QR data:', error);
    return null;
  }
}

/**
 * Calculate interest overlap percentage between two profiles
 * @param interests1 - First profile's interests array
 * @param interests2 - Second profile's interests array
 * @returns Percentage of matching interests (0-100)
 */
export function calculateInterestOverlap(
  interests1: string[] | null,
  interests2: string[] | null
): number {
  if (!interests1 || !interests2 || interests1.length === 0 || interests2.length === 0) {
    return 0;
  }

  // Normalize interests (lowercase, trim)
  const normalized1 = interests1.map(i => i.toLowerCase().trim());
  const normalized2 = interests2.map(i => i.toLowerCase().trim());

  // Find matching interests
  const matches = normalized1.filter(i => normalized2.includes(i));
  
  // Calculate percentage based on the smaller array
  const smallerArray = Math.min(normalized1.length, normalized2.length);
  const overlapPercentage = (matches.length / smallerArray) * 100;

  return Math.round(overlapPercentage);
}

