"""Shared test fixtures and configuration for backend tests."""

import sys
import os

# Add the backend directory to the Python path so imports work correctly
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

