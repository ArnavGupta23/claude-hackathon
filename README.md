# LinkUp - NFC-Powered College Networking App

A React Native (Expo) mobile app that enables students to exchange profiles by tapping their phones together using NFC technology.

## 🚀 Features

- **NFC Profile Exchange**: Tap phones to instantly exchange profiles
- **Profile Management**: Create and edit your profile with name, major, interests, and bio
- **Connection History**: View all your connections in one place
- **Supabase Integration**: Cloud-based profile storage and connection tracking

## 📋 Prerequisites

- Node.js (v16 or higher)
- Expo CLI (`npm install -g expo-cli`)
- Supabase account and project
- Physical device with NFC support (for testing NFC features)

## 🛠️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the following SQL in your Supabase SQL Editor:

```sql
-- Create profiles table
create table profiles (
  id uuid primary key default uuid_generate_v4(),
  name text,
  major text,
  interests text[],
  bio text,
  nfc_tag text unique,
  created_at timestamp default now()
);

-- Create connections table
create table connections (
  id serial primary key,
  user_a uuid references profiles(id),
  user_b uuid references profiles(id),
  connected_at timestamp default now(),
  unique(user_a, user_b)
);

-- Enable Row Level Security (optional, for production)
alter table profiles enable row level security;
alter table connections enable row level security;

-- Create policies (adjust as needed for your security requirements)
create policy "Profiles are viewable by everyone" on profiles for select using (true);
create policy "Profiles are insertable by everyone" on profiles for insert with check (true);
create policy "Profiles are updatable by owner" on profiles for update using (true);

create policy "Connections are viewable by everyone" on connections for select using (true);
create policy "Connections are insertable by everyone" on connections for insert with check (true);
```

3. Get your Supabase URL and anon key from Project Settings > API
4. Update `lib/supabaseClient.ts` with your credentials:

```typescript
const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
```

### 3. Run the App

```bash
# Start Expo development server
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## 📱 Testing NFC Features

**Important**: NFC read/write only works on **real devices**, not in simulators or Expo Go.

### For Development:
- The app includes simulation mode for Expo Go that logs "Simulated NFC tap"
- For full NFC functionality, build a development build using EAS Build

### For Production:
1. Build with EAS Build:
   ```bash
   npm install -g eas-cli
   eas login
   eas build --platform android
   eas build --platform ios
   ```

2. Install the built app on a physical device
3. Enable NFC in device settings
4. Test NFC read/write functionality

## 📁 Project Structure

```
/linkup
 ├── App.tsx                    # Main app component with navigation
 ├── app.json                   # Expo configuration
 ├── package.json              # Dependencies
 ├── tsconfig.json             # TypeScript configuration
 ├── tailwind.config.js        # Tailwind CSS configuration
 ├── /screens
 │   ├── OnboardingScreen.tsx  # First-time user setup
 │   ├── ProfileScreen.tsx     # User's own profile
 │   ├── NFCScanScreen.tsx     # NFC tag scanning
 │   └── ConnectionsScreen.tsx # Connection history
 ├── /components
 │   ├── ProfileCard.tsx       # Profile display card
 │   ├── NFCButton.tsx         # NFC write button
 │   └── ConnectionItem.tsx   # Connection list item
 └── /lib
     ├── supabaseClient.ts    # Supabase configuration & functions
     └── nfcHandler.ts        # NFC read/write utilities
```

## 🎨 Design

- **Primary Color**: Deep Blue (#1A237E)
- **Accent Color**: Mint (#4DB6AC)
- **UI Framework**: React Native Paper + NativeWind (Tailwind)

## 🔧 Key Functions

### NFC Operations
- `initNFC()`: Initialize NFC manager
- `writeTag(profileId)`: Write profile ID to NFC tag
- `readTag(onRead)`: Listen for and read NFC tags
- `stopReading()`: Stop NFC scanning

### Supabase Operations
- `createProfile(data)`: Create new user profile
- `getProfileById(id)`: Fetch profile by UUID
- `getProfileByNfcTag(tag)`: Fetch profile by NFC tag
- `updateProfile(id, updates)`: Update existing profile
- `createConnection(userA, userB)`: Create connection between users
- `getUserConnections(userId)`: Get all connections for a user

## 📝 Notes

- All major functions are commented for easy extension
- The app uses AsyncStorage to persist user profile ID locally
- NFC simulation mode is enabled for Expo Go development
- Connection deduplication is handled automatically

## 🐛 Troubleshooting

**NFC not working?**
- Ensure NFC is enabled in device settings
- Make sure you're testing on a physical device (not simulator)
- Check that you've built a development build (not using Expo Go)

**Supabase connection errors?**
- Verify your Supabase URL and anon key are correct
- Check that your Supabase tables are created correctly
- Ensure Row Level Security policies allow your operations

## 📄 License

This project is created for the hackathon. Feel free to extend and modify as needed!

