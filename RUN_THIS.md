# 🚀 Run These Commands (Copy & Paste)

## Step 1: Open Terminal and Navigate
```bash
cd ~/Documents/claudehackathon
```

## Step 2: Install Dependencies (First Time Only)
```bash
npm install --legacy-peer-deps
```

## Step 3: Start the Server
```bash
npx expo start --tunnel --clear
```

## Step 4: Connect Your Phone
- Wait for QR code to appear in terminal
- Open **Expo Go** on your phone
- **Scan the QR code**
- If you see connection error: Tap **"Reload JS"** in Expo Go

---

## ✅ That's It!

Everything works **100% locally** - no accounts, no APIs needed:
- ✅ Profiles saved locally on each device
- ✅ Connections saved locally
- ✅ NFC works in demo mode
- ✅ QR codes work (manual entry in Expo Go)
- ✅ Proximity notifications work locally

---

## 🛑 To Stop Server
Press `Ctrl + C` in terminal

---

## 🔧 If You See Errors

**Clear cache and restart:**
```bash
npx expo start --tunnel --clear
```

**Or kill old processes:**
```bash
pkill -f "expo start"
npx expo start --tunnel --clear
```

