# NFC Connection Guide - LinkUp App

## How NFC Works in LinkUp

### Overview
LinkUp uses NFC (Near Field Communication) to instantly exchange profiles between two users by tapping their phones together. This creates a bidirectional connection that's stored for both users.

---

## 🔧 Technical Implementation

### 1. **NFC Write (Creating Your Tag)**

**What Happens:**
- User taps "Write to NFC Tag" button on Profile Screen
- App writes their unique `profileId` to the NFC tag
- In real mode: Data is written to physical NFC tag/sticker
- In demo mode: Simulates the write operation

**File:** `lib/nfcHandler.ts` - `writeTag()` function
```typescript
await writeTag(profileId); // Writes user's profile ID to tag
```

### 2. **NFC Read (Scanning Someone's Tag)**

**What Happens:**
- User navigates to "Scan NFC Tag" screen
- App starts listening for NFC tags
- When phone detects a tag, it reads the `profileId`
- App fetches the profile associated with that ID
- Connection is created between both users

**File:** `lib/nfcHandler.ts` - `readTag()` function

---

## 📱 Demo Mode vs Real Mode

### Demo Mode (Expo Go)
When running in Expo Go or without physical NFC:

**NFC Write:**
- Simulates writing to tag
- Logs to console: `"Simulated NFC write: {profileId}"`

**NFC Read:**
- Creates a virtual "Demo User" profile
- Profile details:
  - Name: "Demo User"
  - Major: "Computer Science"
  - Interests: ["Technology", "Music", "Sports"]
- This simulates scanning someone else's phone
- Connection is created with this virtual user

### Real Mode (Physical Devices)
When running on actual devices with NFC:

**Requirements:**
- Physical NFC-enabled phone (Android/iPhone with NFC)
- NFC tags or two phones with NFC
- App built with EAS Build (not Expo Go)

**NFC Write:**
- Actually writes profile ID to NFC tag using NDEF format
- Can write to: NFC stickers, cards, or another phone

**NFC Read:**
- Reads actual NDEF data from physical tag
- Retrieves real profile ID from scanned device
- Creates genuine connection between two users

---

## 🔄 Connection Flow (Two Users)

### Scenario: Alice and Bob tap phones

**Step 1: Alice's Phone**
1. Alice has profile ID: `alice-123`
2. Alice taps "Write to NFC Tag"
3. Her phone's NFC chip now broadcasts `alice-123`

**Step 2: Bob Scans Alice**
1. Bob opens "Scan NFC Tag" screen
2. Bob taps his phone to Alice's phone
3. Bob's phone reads: `alice-123`
4. Bob's app:
   - Fetches Alice's profile from database
   - Creates connection: `(bob-456, alice-123)`
   - Stores in `demo_connections`
   - Shows "Connected with Alice!"

**Step 3: Alice Scans Bob** (Reciprocal)
1. Bob writes his ID to his NFC
2. Alice scans Bob's phone
3. Alice's app:
   - Fetches Bob's profile
   - Creates connection: `(alice-123, bob-456)`
   - Both users now see each other in "My Connections"

---

## 💾 Data Storage

### Local Storage (Demo Mode)

**AsyncStorage Keys:**
```javascript
{
  "demo_profiles": [
    {
      "id": "alice-123",
      "name": "Alice",
      "major": "Engineering",
      "interests": ["Coding", "Music"],
      // ... other fields
    },
    {
      "id": "demo-scanned-{timestamp}",
      "name": "Demo User",
      "major": "Computer Science",
      "interests": ["Technology", "Music", "Sports"],
      // ... created when scanning NFC
    }
  ],

  "demo_connections": [
    {
      "id": 1,
      "user_a": "alice-123",
      "user_b": "demo-scanned-{timestamp}",
      "connected_at": "2025-01-08T00:00:00.000Z"
    }
  ],

  "nfc_connection_log": [
    {
      "user_a": "alice-123",
      "user_b": "demo-scanned-{timestamp}",
      "timestamp": "2025-01-08T00:00:00.000Z",
      "method": "nfc"
    }
  ]
}
```

### Supabase (Production Mode)

**Tables:**
- `profiles`: Stores all user profiles
- `connections`: Stores all connections between users

**Connection Record:**
```sql
INSERT INTO connections (user_a, user_b, connected_at)
VALUES ('alice-123', 'bob-456', NOW());
```

Note: Connections are stored in sorted order (`user_a < user_b`) to prevent duplicates.

---

## ✅ Current Fixes Applied

### Problem: "Can't connect to yourself"
**Cause:** Demo mode was randomly selecting profiles, sometimes picking current user

**Fix:**
- `nfcHandler.ts` now creates a dedicated "Demo User" profile
- This profile is always different from the current user
- Name check added in `NFCScanScreen.tsx` to prevent self-connection

### Problem: Connections not appearing
**Cause:** Profiles weren't being stored properly in demo mode

**Fix:**
- `updateProfile()` now properly saves to AsyncStorage in demo mode
- `createConnection()` already had proper storage logic
- Both users' connection lists update correctly

---

## 🧪 Testing NFC

### In Demo Mode (Expo Go)

1. **Create Your Profile:**
   - Open app
   - Fill in name, major, interests
   - Complete onboarding

2. **Test NFC Write:**
   - Go to Profile screen
   - Tap "Write to NFC Tag"
   - Should see success message
   - Check console: `"Simulated NFC write: {your-id}"`

3. **Test NFC Scan:**
   - Tap "Scan NFC Tag" button
   - Tap "Start Scanning"
   - Wait 2 seconds (simulated delay)
   - Should see "Demo User" profile
   - Connection created automatically
   - Check "My Connections" to see the new connection

4. **Verify Connection:**
   - Go to "My Connections"
   - Should see "Demo User" listed
   - Shows connection time
   - Search should work

### In Real Mode (Physical Devices)

**Required:**
- Two phones with NFC
- App built with `eas build`
- NFC enabled in phone settings

**Steps:**
1. **User A:**
   - Open app, create profile
   - Tap "Write to NFC Tag"
   - Hold phone (back-to-back with User B)

2. **User B:**
   - Open app, create profile
   - Tap "Scan NFC Tag"
   - Hold phone to User A's phone
   - Should read User A's profile
   - Connection created

3. **Switch Roles:**
   - User B writes NFC
   - User A scans
   - Now both have each other as connections

---

## 🐛 Debugging

### Check NFC Status
```typescript
import { isNFCAvailable } from './lib/nfcHandler';

const available = await isNFCAvailable();
console.log('NFC Available:', available);
```

### View Stored Connections
```javascript
// In React Native Debugger or Chrome DevTools
const connections = await AsyncStorage.getItem('demo_connections');
console.log('Connections:', JSON.parse(connections));
```

### View Stored Profiles
```javascript
const profiles = await AsyncStorage.getItem('demo_profiles');
console.log('Profiles:', JSON.parse(profiles));
```

### Check Connection Log
```javascript
const log = await AsyncStorage.getItem('nfc_connection_log');
console.log('Connection Log:', JSON.parse(log));
```

---

## 📋 NFC Best Practices

### For Development
1. Test in demo mode first using Expo Go
2. Verify connections appear in "My Connections"
3. Check AsyncStorage data in React Native Debugger
4. Build with EAS for real NFC testing

### For Production
1. Always check `isNFCAvailable()` before operations
2. Handle NFC permission requests gracefully
3. Show clear UI feedback during NFC operations
4. Timeout NFC operations after reasonable delay
5. Log all NFC activities for debugging

### For Users
1. Hold phones back-to-back (where NFC chip is located)
2. Keep phones still for 1-2 seconds
3. One phone writes, other phone scans
4. Both users should exchange NFC to create reciprocal connection

---

## 🔐 Security Notes

- Profile IDs are UUIDs (universally unique)
- No sensitive data stored on NFC tags
- Only profile ID is transmitted via NFC
- Full profile data fetched from secure database
- Connections are deduplicated automatically

---

## 📚 Related Files

- `lib/nfcHandler.ts` - NFC read/write logic
- `lib/supabaseClient.ts` - Profile & connection storage
- `screens/NFCScanScreen.tsx` - NFC scanning UI
- `components/NFCButton.tsx` - NFC write button
- `screens/ConnectionsScreen.tsx` - View connections

---

## 🎯 Summary

**Demo Mode:**
- ✅ Simulates NFC with virtual "Demo User"
- ✅ Creates real connections in AsyncStorage
- ✅ Works in Expo Go without physical NFC
- ✅ Perfect for development and testing

**Real Mode:**
- ✅ Uses actual NFC hardware
- ✅ Writes NDEF data to tags
- ✅ Reads from physical tags/phones
- ✅ Production-ready with EAS Build

**Both Modes:**
- ✅ Store connections for both users
- ✅ Prevent self-connections
- ✅ Deduplicate connections
- ✅ Log all activities
- ✅ Work offline (local-first)
