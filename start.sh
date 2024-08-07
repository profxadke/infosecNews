#!/bin/bash

# Create and activate a virtual environment
pip3 install -U pip uv
uv venv
source .venv/bin/activate

# Install dependencies
uv pip3 install -Ur requirements.txt

# Run the main application
python3 ./main.py
