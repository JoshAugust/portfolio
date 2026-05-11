#!/bin/bash

# dev.sh - Startup script for mess.ai.ah
# Runs FastAPI backend and React frontend concurrently.
# Handles graceful shutdown on Ctrl+C.

# Function to kill processes on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    
    if [ ! -z "$BACKEND_PID" ]; then
        echo "   Killing Backend (PID $BACKEND_PID)..."
        kill $BACKEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "   Killing Frontend (PID $FRONTEND_PID)..."
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    echo "✅ Done."
    exit
}

# Trap SIGINT (Ctrl+C) and SIGTERM
trap cleanup SIGINT SIGTERM

echo "============================================================"
echo "  🚀 Starting mess.ai.ah Development Environment"
echo "============================================================"

# Handover Check
if [ ! -d ".venv" ]; then
    echo "❌ Error: .venv virtual environment not found!"
    exit 1
fi

# 1. Start Backend
echo "py  Starting FastAPI server (port 8000)..."
source .venv/bin/activate
uvicorn server:app --reload --port 8000 &
BACKEND_PID=$!

# Wait a moment for backend to initialize
sleep 2

# 2. Start Frontend
echo "js  Starting React frontend..."
npm run dev &
FRONTEND_PID=$!

echo "============================================================"
echo "  ✅ Both services running."
echo "  backend:  http://localhost:8000"
echo "  frontend: http://localhost:5173"
echo "  Press Ctrl+C to stop both."
echo "============================================================"

# Wait for processes
wait
