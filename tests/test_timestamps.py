import pytest
import sys
import os
import time

# Add backend to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../backend')))

from utils.timestamps import start_timer, stop_timer

def test_timer_elapsed():
    start = start_timer()
    time.sleep(0.01) # Sleep 10ms
    elapsed = stop_timer(start)
    
    # Needs to be roughly 10ms (allowing small scheduler jitter)
    assert elapsed > 0
    assert 5.0 <= elapsed <= 50.0

def test_fast_execution():
    start = start_timer()
    elapsed = stop_timer(start)
    
    # Needs to be >= 0 but extremely fast
    assert elapsed >= 0
    assert elapsed < 5.0
