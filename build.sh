#!/usr/bin/env bash
# Exit on error
set -o errexit

echo ">>> Building React Frontend..."
cd frontend
npm ci || npm install
npm run build
cd ..

echo ">>> Installing Python Backend Dependencies..."
cd backend
pip install --upgrade pip
pip install -r requirements.txt
cd ..

echo ">>> Build completed successfully!"
