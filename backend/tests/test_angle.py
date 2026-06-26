# backend/tests/test_angle.py
from services.pose_engine import calculate_angle

def test_right_angle():
    # A right angle at B
    a = (0, 1)
    b = (0, 0)
    c = (1, 0)
    assert abs(calculate_angle(a, b, c) - 90.0) < 0.1

def test_straight_line():
    a = (0, 0)
    b = (1, 0)
    c = (2, 0)
    assert abs(calculate_angle(a, b, c) - 180.0) < 0.1

def test_acute_angle():
    a = (0, 1)
    b = (0, 0)
    c = (0.5, 0.5)
    result = calculate_angle(a, b, c)
    assert 40 < result < 50   # ~45°