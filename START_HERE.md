# 🚀 Quick Start Commands

## Copy and paste these commands one by one:

### Step 1: Navigate to project
```bash
cd ~/Documents/claudehackathon
```

### Step 2: Install/Update dependencies
```bash
npm install --legacy-peer-deps
```

### Step 3: Start the server
```bash
npx expo start --tunnel
```

### Step 4: Connect your phone
- **iOS**: Open Camera app → Scan QR code in terminal
- **Android**: Open Expo Go → Scan QR code

**That's it!** The app should load on your phone.

---

## If you see connection errors:

1. **In Expo Go**: Tap "Reload JS" button
2. **Or**: Close Expo Go completely and reopen it
3. **Or**: Scan the QR code again

---

## Troubleshooting:

**If port is busy:**
```bash
pkill -f "expo start"
npx expo start --tunnel
```

**If you see module errors:**
```bash
npm install --legacy-peer-deps
npx expo start --clear --tunnel
```

