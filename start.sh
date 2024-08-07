#!/bin/bash

# Create and activate a virtual environment
pip3 install -U pip
curl -LsSf https://astral.sh/uv/install.sh | sh
cp /tmp/tmp.*/uv .
chmod +x ./uv
./uv venv
source .venv/bin/activate

# Install dependencies.
./uv pip install urllib3==1.26.6
./uv pip install -Ur requirements.txt

# Run the main application
python3 ./main.py
