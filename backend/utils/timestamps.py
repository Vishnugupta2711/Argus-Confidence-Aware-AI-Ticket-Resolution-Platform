import time

def start_timer() -> float:
    """
    Returns the current high-resolution performance counter time.
    """
    return time.perf_counter()

def stop_timer(start_time: float) -> float:
    """
    Given a start time, calculates the elapsed duration in milliseconds.
    Rounds to two decimal places.
    """
    elapsed_seconds = time.perf_counter() - start_time
    return round(elapsed_seconds * 1000.0, 2)
