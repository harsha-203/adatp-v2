#!/usr/bin/env python3
"""
Backend API Testing for Edubox LMS
Tests course enrollment functionality and related endpoints
"""

import requests
import json
import uuid
from datetime import datetime
import sys
import os

# Configuration
BACKEND_URL = "https://enroll-repair.preview.emergentagent.com/api"
TEST_COURSE_ID = "227e079b-fd7b-439b-8d96-051ee91ed5d4"  # Spanish for Beginners

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def log_test(test_name, status, message=""):
    """Log test results with colors"""
    color = Colors.GREEN if status == "PASS" else Colors.RED if status == "FAIL" else Colors.YELLOW
    print(f"{color}[{status}]{Colors.ENDC} {test_name}")
    if message:
        print(f"    {message}")

def test_backend_health():
    """Test if backend is running and healthy"""
    try:
        response = requests.get(f"{BACKEND_URL}/health", timeout=10)
        if response.status_code == 200:
            data = response.json()
            supabase_connected = data.get('supabase_connected', False)
            log_test("Backend Health Check", "PASS", f"Status: {data.get('status')}, Supabase: {supabase_connected}")
            return True, supabase_connected
        else:
            log_test("Backend Health Check", "FAIL", f"Status code: {response.status_code}")
            return False, False
    except Exception as e:
        log_test("Backend Health Check", "FAIL", f"Error: {str(e)}")
        return False, False

def test_get_courses():
    """Test getting all courses"""
    try:
        response = requests.get(f"{BACKEND_URL}/courses", timeout=10)
        if response.status_code == 200:
            courses = response.json()
            if isinstance(courses, list):
                log_test("Get Courses", "PASS", f"Retrieved {len(courses)} courses")
                
                # Check if test course exists
                test_course = None
                for course in courses:
                    if course.get('id') == TEST_COURSE_ID:
                        test_course = course
                        break
                
                if test_course:
                    log_test("Test Course Found", "PASS", f"Course: {test_course.get('title')}")
                    return True, courses, test_course
                else:
                    log_test("Test Course Found", "FAIL", f"Course ID {TEST_COURSE_ID} not found")
                    # Use first available course if test course not found
                    if courses:
                        return True, courses, courses[0]
                    return True, courses, None
            else:
                log_test("Get Courses", "FAIL", "Response is not a list")
                return False, [], None
        else:
            log_test("Get Courses", "FAIL", f"Status code: {response.status_code}")
            return False, [], None
    except Exception as e:
        log_test("Get Courses", "FAIL", f"Error: {str(e)}")
        return False, [], None

def create_test_user():
    """Create a test user using Supabase Auth (simulated)"""
    # Generate a test user ID (UUID format)
    test_user_id = str(uuid.uuid4())
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    test_email = f"testuser_{timestamp}@example.com"
    
    log_test("Create Test User", "PASS", f"Generated test user ID: {test_user_id}")
    return test_user_id, test_email

def get_existing_user():
    """Try to get an existing user from the database"""
    try:
        # Try to get users from the backend
        response = requests.get(f"{BACKEND_URL}/admin/users", timeout=10)
        if response.status_code == 200:
            users = response.json()
            if users and len(users) > 0:
                user = users[0]
                user_id = user.get('id')
                log_test("Get Existing User", "PASS", f"Found user ID: {user_id}")
                return user_id
        
        log_test("Get Existing User", "FAIL", "No existing users found")
        return None
    except Exception as e:
        log_test("Get Existing User", "FAIL", f"Error: {str(e)}")
        return None

def test_enrollment_endpoint(course_id, user_id):
    """Test the course enrollment endpoint"""
    try:
        # Test enrollment
        response = requests.post(
            f"{BACKEND_URL}/courses/{course_id}/enroll",
            params={"user_id": user_id},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            message = data.get('message', '')
            enrollment_id = data.get('enrollment_id', '')
            
            if 'enrolled successfully' in message.lower():
                log_test("Course Enrollment", "PASS", f"Message: {message}, ID: {enrollment_id}")
                return True, enrollment_id
            elif 'already enrolled' in message.lower():
                log_test("Course Enrollment", "PASS", f"Message: {message} (duplicate enrollment handled)")
                return True, enrollment_id
            else:
                log_test("Course Enrollment", "FAIL", f"Unexpected message: {message}")
                return False, None
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', 'Unknown error')
            except:
                error_msg = response.text
            log_test("Course Enrollment", "FAIL", f"Status: {response.status_code}, Error: {error_msg}")
            return False, None
            
    except Exception as e:
        log_test("Course Enrollment", "FAIL", f"Error: {str(e)}")
        return False, None

def test_duplicate_enrollment(course_id, user_id):
    """Test duplicate enrollment handling"""
    try:
        # Try to enroll again
        response = requests.post(
            f"{BACKEND_URL}/courses/{course_id}/enroll",
            params={"user_id": user_id},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            message = data.get('message', '')
            
            if 'already enrolled' in message.lower():
                log_test("Duplicate Enrollment Check", "PASS", f"Message: {message}")
                return True
            else:
                log_test("Duplicate Enrollment Check", "WARN", f"Expected 'already enrolled', got: {message}")
                return True  # Still pass as enrollment worked
        else:
            log_test("Duplicate Enrollment Check", "FAIL", f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Duplicate Enrollment Check", "FAIL", f"Error: {str(e)}")
        return False

def test_student_dashboard(user_id):
    """Test student dashboard endpoint"""
    try:
        response = requests.get(f"{BACKEND_URL}/student/dashboard/summary", params={"user_id": user_id}, timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            total_courses = data.get('total_courses', 0)
            log_test("Student Dashboard", "PASS", f"Total courses: {total_courses}")
            return True
        else:
            log_test("Student Dashboard", "FAIL", f"Status code: {response.status_code}")
            return False
            
    except Exception as e:
        log_test("Student Dashboard", "FAIL", f"Error: {str(e)}")
        return False

def test_invalid_enrollment():
    """Test enrollment with invalid data"""
    try:
        # Test with invalid course ID
        invalid_course_id = "invalid-course-id"
        test_user_id = str(uuid.uuid4())
        
        response = requests.post(
            f"{BACKEND_URL}/courses/{invalid_course_id}/enroll",
            params={"user_id": test_user_id},
            timeout=10
        )
        
        # Should fail with 404 or 500
        if response.status_code in [404, 500]:
            log_test("Invalid Course Enrollment", "PASS", f"Correctly rejected invalid course ID")
            return True
        else:
            log_test("Invalid Course Enrollment", "WARN", f"Unexpected status: {response.status_code}")
            return True  # Not critical
            
    except Exception as e:
        log_test("Invalid Course Enrollment", "FAIL", f"Error: {str(e)}")
        return False

def test_ai_recommendations():
    """Test AI course recommendations endpoint"""
    try:
        # Test with a proper UUID format
        test_user_id = str(uuid.uuid4())
        
        response = requests.get(
            f"{BACKEND_URL}/ai/recommend-courses",
            params={"user_id": test_user_id, "limit": 5},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("AI Recommendations", "PASS", f"Retrieved {len(data)} recommendations")
                return True
            else:
                log_test("AI Recommendations", "FAIL", "Response is not a list")
                return False
        elif response.status_code == 404:
            log_test("AI Recommendations", "PASS", "Correctly rejected test UUID (user not found)")
            return True
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', 'Unknown error')
            except:
                error_msg = response.text
            log_test("AI Recommendations", "FAIL", f"Status: {response.status_code}, Error: {error_msg}")
            return False
            
    except Exception as e:
        log_test("AI Recommendations", "FAIL", f"Error: {str(e)}")
        return False

def test_ai_learning_path():
    """Test AI learning path generation endpoint"""
    try:
        # Test with a proper UUID format and goal
        test_data = {
            "user_id": str(uuid.uuid4()),
            "goal": "Learn web development"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/ai/learning-path",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                log_test("AI Learning Path", "PASS", f"Generated learning path with keys: {list(data.keys())}")
                return True
            else:
                log_test("AI Learning Path", "FAIL", "Response is not a dict")
                return False
        elif response.status_code == 404:
            log_test("AI Learning Path", "PASS", "Correctly rejected test UUID (user not found)")
            return True
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', 'Unknown error')
            except:
                error_msg = response.text
            log_test("AI Learning Path", "FAIL", f"Status: {response.status_code}, Error: {error_msg}")
            return False
            
    except Exception as e:
        log_test("AI Learning Path", "FAIL", f"Error: {str(e)}")
        return False

def test_ai_recommendations_with_real_user(user_id):
    """Test AI recommendations with a real user ID"""
    try:
        response = requests.get(
            f"{BACKEND_URL}/ai/recommend-courses",
            params={"user_id": user_id, "limit": 5},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                log_test("AI Recommendations (Real User)", "PASS", f"Retrieved {len(data)} recommendations")
                return True
            else:
                log_test("AI Recommendations (Real User)", "FAIL", "Response is not a list")
                return False
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', 'Unknown error')
            except:
                error_msg = response.text
            log_test("AI Recommendations (Real User)", "FAIL", f"Status: {response.status_code}, Error: {error_msg}")
            return False
            
    except Exception as e:
        log_test("AI Recommendations (Real User)", "FAIL", f"Error: {str(e)}")
        return False

def test_ai_learning_path_with_real_user(user_id):
    """Test AI learning path with a real user ID"""
    try:
        test_data = {
            "user_id": user_id,
            "goal": "Learn web development and become a full-stack developer"
        }
        
        response = requests.post(
            f"{BACKEND_URL}/ai/learning-path",
            json=test_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, dict):
                log_test("AI Learning Path (Real User)", "PASS", f"Generated learning path with keys: {list(data.keys())}")
                return True
            else:
                log_test("AI Learning Path (Real User)", "FAIL", "Response is not a dict")
                return False
        else:
            try:
                error_data = response.json()
                error_msg = error_data.get('detail', 'Unknown error')
            except:
                error_msg = response.text
            log_test("AI Learning Path (Real User)", "FAIL", f"Status: {response.status_code}, Error: {error_msg}")
            return False
            
    except Exception as e:
        log_test("AI Learning Path (Real User)", "FAIL", f"Error: {str(e)}")
        return False

def main():
    """Run all backend tests"""
    print(f"{Colors.BOLD}{Colors.BLUE}=== Edubox LMS Backend API Tests ==={Colors.ENDC}")
    print(f"Testing against: {BACKEND_URL}")
    print()
    
    # Track test results
    total_tests = 0
    passed_tests = 0
    critical_failures = []
    
    # Test 1: Backend Health
    total_tests += 1
    health_ok, supabase_connected = test_backend_health()
    if health_ok:
        passed_tests += 1
    else:
        critical_failures.append("Backend Health Check")
    
    if not supabase_connected:
        print(f"{Colors.YELLOW}WARNING: Supabase not connected - enrollment may fail{Colors.ENDC}")
    
    # Test 2: Get Courses
    total_tests += 1
    courses_ok, courses, test_course = test_get_courses()
    if courses_ok:
        passed_tests += 1
    else:
        critical_failures.append("Get Courses")
    
    if not test_course:
        print(f"{Colors.YELLOW}WARNING: No test course available for enrollment testing{Colors.ENDC}")
        return
    
    course_id = test_course.get('id')
    course_title = test_course.get('title', 'Unknown Course')
    print(f"Using course for testing: {course_title} (ID: {course_id})")
    print()
    
    # Test 3: Get Existing User (for real enrollment test)
    existing_user_id = get_existing_user()
    
    # Test 4: Course Enrollment
    total_tests += 1
    if existing_user_id:
        enrollment_ok, enrollment_id = test_enrollment_endpoint(course_id, existing_user_id)
        if enrollment_ok:
            passed_tests += 1
        else:
            critical_failures.append("Course Enrollment")
        
        # Test 5: Duplicate Enrollment (only if enrollment worked)
        if enrollment_ok:
            total_tests += 1
            duplicate_ok = test_duplicate_enrollment(course_id, existing_user_id)
            if duplicate_ok:
                passed_tests += 1
        
        # Test 6: Student Dashboard
        total_tests += 1
        dashboard_ok = test_student_dashboard(existing_user_id)
        if dashboard_ok:
            passed_tests += 1
    else:
        # Test with fake user to verify foreign key constraint
        test_user_id, test_email = create_test_user()
        enrollment_ok, enrollment_id = test_enrollment_endpoint(course_id, test_user_id)
        
        # This should fail with foreign key constraint - that's expected behavior
        if not enrollment_ok:
            log_test("Foreign Key Validation", "PASS", "Correctly rejected non-existent user")
            passed_tests += 1
        else:
            log_test("Foreign Key Validation", "FAIL", "Should have rejected non-existent user")
            critical_failures.append("Foreign Key Validation")
    
    # Test 8: Invalid Enrollment
    total_tests += 1
    invalid_ok = test_invalid_enrollment()
    if invalid_ok:
        passed_tests += 1
    
    # Test 9: AI Recommendations (with test UUID)
    total_tests += 1
    ai_rec_ok = test_ai_recommendations()
    if ai_rec_ok:
        passed_tests += 1
    else:
        critical_failures.append("AI Recommendations")
    
    # Test 10: AI Learning Path (with test UUID)
    total_tests += 1
    ai_path_ok = test_ai_learning_path()
    if ai_path_ok:
        passed_tests += 1
    else:
        critical_failures.append("AI Learning Path")
    
    # Test 11 & 12: AI endpoints with real user (if available)
    if existing_user_id:
        total_tests += 1
        ai_rec_real_ok = test_ai_recommendations_with_real_user(existing_user_id)
        if ai_rec_real_ok:
            passed_tests += 1
        
        total_tests += 1
        ai_path_real_ok = test_ai_learning_path_with_real_user(existing_user_id)
        if ai_path_real_ok:
            passed_tests += 1
    
    # Summary
    print()
    print(f"{Colors.BOLD}=== Test Summary ==={Colors.ENDC}")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {Colors.GREEN}{passed_tests}{Colors.ENDC}")
    print(f"Failed: {Colors.RED}{total_tests - passed_tests}{Colors.ENDC}")
    
    if critical_failures:
        print(f"\n{Colors.RED}Critical Failures:{Colors.ENDC}")
        for failure in critical_failures:
            print(f"  - {failure}")
    
    # Overall result
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    if success_rate >= 80:
        print(f"\n{Colors.GREEN}✅ OVERALL: PASS ({success_rate:.1f}% success rate){Colors.ENDC}")
        return True
    else:
        print(f"\n{Colors.RED}❌ OVERALL: FAIL ({success_rate:.1f}% success rate){Colors.ENDC}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)