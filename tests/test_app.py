import pytest
from fastapi.testclient import TestClient
from src.app import app

# Create a test client
client = TestClient(app)

def test_root_redirect():
    """Test that root endpoint redirects to static/index.html"""
    response = client.get("/", follow_redirects=False)
    assert response.status_code == 302  # Found/Temporary redirect
    assert response.headers["location"] == "/static/index.html"

def test_get_activities():
    """Test getting all activities"""
    response = client.get("/activities")
    assert response.status_code == 200
    activities = response.json()
    assert isinstance(activities, dict)
    assert "Chess Club" in activities
    assert "Programming Class" in activities

def test_signup_for_activity():
    """Test signing up for an activity"""
    # Test successful signup
    email = "test@mergington.edu"
    response = client.post(f"/activities/Chess Club/signup?email={email}")
    assert response.status_code == 200
    assert response.json()["message"] == f"Signed up {email} for Chess Club"

    # Verify participant was added
    activities = client.get("/activities").json()
    assert email in activities["Chess Club"]["participants"]

def test_signup_for_nonexistent_activity():
    """Test signing up for a non-existent activity"""
    email = "test@mergington.edu"
    response = client.post(f"/activities/NonexistentClub/signup?email={email}")
    assert response.status_code == 404
    assert response.json()["detail"] == "Activity not found"

def test_duplicate_signup():
    """Test signing up the same student twice"""
    email = "duplicate@mergington.edu"
    activity = "Programming Class"
    
    # First signup should succeed
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200

    # Second signup should fail
    response = client.post(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Student already signed up for this activity"

def test_unregister_from_activity():
    """Test unregistering from an activity"""
    # First sign up a student
    email = "unregister@mergington.edu"
    activity = "Chess Club"
    client.post(f"/activities/{activity}/signup?email={email}")

    # Now unregister them
    response = client.delete(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 200
    assert response.json()["status"] == "success"

    # Verify participant was removed
    activities = client.get("/activities").json()
    assert email not in activities[activity]["participants"]

def test_unregister_not_registered():
    """Test unregistering a student who isn't registered"""
    email = "notregistered@mergington.edu"
    activity = "Chess Club"
    
    response = client.delete(f"/activities/{activity}/signup?email={email}")
    assert response.status_code == 400
    assert response.json()["detail"] == "Student is not signed up for this activity"

def test_max_participants():
    """Test signing up when activity is at max capacity"""
    activity = "Chess Club"
    
    # Get current activity info
    activities = client.get("/activities").json()
    max_participants = activities[activity]["max_participants"]
    current_participants = activities[activity]["participants"]
    
    # Fill up the activity to max capacity
    for i in range(max_participants - len(current_participants)):
        email = f"student{i}@mergington.edu"
        response = client.post(f"/activities/{activity}/signup?email={email}")
        assert response.status_code == 200
    
    # Try to add one more participant
    response = client.post(f"/activities/{activity}/signup?email=overflow@mergington.edu")
    assert response.status_code == 400
    assert "at maximum capacity" in response.json()["detail"].lower()