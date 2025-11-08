# Commands to Start and Test LinkUp

## Step 1: Navigate to Project Directory
```bash
cd ~/Documents/claudehackathon
```

## Step 2: Start Expo Server
```bash
npx expo start
```

This will:
- Start the Metro bundler
- Show a QR code in your terminal
- Display connection options

## Step 3: Connect Your Phone

**On your phone:**
- **iOS**: Open Camera app → Point at QR code in terminal
- **Android**: Open Expo Go app → Tap "Scan QR code" → Scan QR code

**Alternative (if QR code doesn't work):**
- Press `s` in the terminal to switch to tunnel mode
- Or press `a` for Android / `i` for iOS simulator

## Step 4: Test the App

Once connected:
1. **Create Profile**: Enter name, major, and interests (e.g., "Music, AI, Basketball")
2. **View QR Code**: Your profile screen shows your QR code
3. **Scan QR Code**: Tap "📷 Scan QR Code" to scan someone else's
4. **Test Proximity**: Grant location/notification permissions to test nearby user detection

## Troubleshooting

**If port 8081 is busy:**
```bash
# Kill existing Expo processes
pkill -f "expo start"
# Then try again
npx expo start
```

**If you need to clear cache:**
```bash
npx expo start --clear
```

**To stop the server:**
- Press `Ctrl + C` in the terminal

