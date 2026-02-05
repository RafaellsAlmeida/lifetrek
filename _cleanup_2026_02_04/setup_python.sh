#!/bin/bash

cd apps/agent-service

if [ ! -d "venv" ]; then
    echo "Creating virtualenv..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "Installing requirements..."
pip install -r requirements.txt

echo "Setup complete. Run 'npm run dev:agent' to start."
