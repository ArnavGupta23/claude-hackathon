# 📱 Commands to Run LinkUp

## Copy and paste these commands in your terminal:

### Step 1: Go to project folder
```bash
cd ~/Documents/claudehackathon
```

### Step 2: Install dependencies (if needed)
```bash
npm install --legacy-peer-deps
```

### Step 3: Start the server
```bash
npx expo start --tunnel
```

**OR use the quick start script:**
```bash
./start.sh
```

---

## After server starts:

1. **Wait for QR code** to appear in terminal
2. **Open Expo Go** on your phone
3. **Scan the QR code** shown in terminal
4. **If you see connection error**: Tap "Reload JS" in Expo Go

---

## That's it! 🎉

The app will load on your phone and you can test:
- ✅ Create profiles (works in demo mode)
- ✅ View QR codes
- ✅ Scan QR codes (manual entry in Expo Go)
- ✅ NFC simulation (works in demo mode)
- ✅ Proximity notifications (50%+ interest match)

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

**To stop the server:**
Press `Ctrl + C` in terminal

