#!/bin/bash

# LinkUp - Quick Start Script
echo "🚀 Starting LinkUp..."
echo ""

# Navigate to project directory
cd ~/Documents/claudehackathon

# Kill any existing Expo processes
echo "Cleaning up old processes..."
pkill -f "expo start" 2>/dev/null || true
pkill -f "ngrok" 2>/dev/null || true
sleep 2

# Start Expo with tunnel
echo "Starting Expo server with tunnel mode..."
echo ""
npx expo start --tunnel

