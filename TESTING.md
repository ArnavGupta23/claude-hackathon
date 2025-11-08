# Testing LinkUp on Your Phone

## 🚀 Quick Start with Expo Go

The Expo development server should now be running! Here's how to test on your phone:

### Step 1: Install Expo Go
- **iOS**: Download "Expo Go" from the App Store
- **Android**: Download "Expo Go" from Google Play Store

### Step 2: Connect Your Phone

**Option A: Scan QR Code (Easiest)**
1. Open Expo Go on your phone
2. Look at your terminal/computer screen - you should see a QR code
3. Scan the QR code with:
   - **iOS**: Use the Camera app
   - **Android**: Use the Expo Go app's "Scan QR code" button

**Option B: Manual Connection**
1. Make sure your phone and computer are on the same WiFi network
2. In Expo Go, tap "Enter URL manually"
3. Enter the URL shown in your terminal (usually something like `exp://192.168.x.x:8081`)

### Step 3: Test the App

⚠️ **Important Notes:**

1. **Supabase Setup Required**: 
   - The app needs Supabase to work properly
   - You'll see errors when trying to create profiles without Supabase
   - To fix: Update `lib/supabaseClient.ts` with your Supabase credentials
   - Or create a free Supabase project at https://supabase.com

2. **NFC Features**:
   - NFC read/write **won't work** in Expo Go (requires native build)
   - The app will use **simulation mode** - you'll see "Simulated NFC tap" in the console
   - To test real NFC, you need to build a development build (see below)

3. **What You Can Test in Expo Go**:
   - ✅ UI/UX flow
   - ✅ Navigation between screens
   - ✅ Profile creation form (will fail without Supabase)
   - ✅ UI components and styling
   - ⚠️ NFC operations (simulated only)

## 🔧 Testing Real NFC Features

To test actual NFC read/write, you need a **development build**:

### Using EAS Build (Recommended)

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure your project
eas build:configure

# Build for your device
eas build --profile development --platform android
# or
eas build --profile development --platform ios
```

Then install the built app on your phone and test NFC features.

### Using Expo Development Build Locally

```bash
# Prebuild native code
npx expo prebuild

# Run on Android
npx expo run:android

# Run on iOS (Mac only)
npx expo run:ios
```

## 📝 Setting Up Supabase (Quick)

1. Go to https://supabase.com and create a free account
2. Create a new project
3. Go to Project Settings > API
4. Copy your "Project URL" and "anon public" key
5. Update `lib/supabaseClient.ts`:
   ```typescript
   const SUPABASE_URL = 'https://your-project.supabase.co';
   const SUPABASE_ANON_KEY = 'your-anon-key-here';
   ```
6. Run the SQL from `supabase-setup.sql` in your Supabase SQL Editor

## 🐛 Troubleshooting

**App won't load?**
- Make sure your phone and computer are on the same WiFi
- Try restarting the Expo server: Press `r` in the terminal

**NFC not working?**
- This is expected in Expo Go - NFC requires native code
- Build a development build to test real NFC

**Supabase errors?**
- Make sure you've configured your Supabase credentials
- Check that you've run the SQL setup script
- Verify your Supabase project is active

**Can't see the QR code?**
- Press `s` in the terminal to switch to tunnel mode
- Or manually enter the connection URL in Expo Go

