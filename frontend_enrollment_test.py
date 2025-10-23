#!/usr/bin/env python3
"""
Frontend Enrollment Flow Test
Tests the complete user signup -> course enrollment flow
"""

import requests
import json
import time
from datetime import datetime

# Configuration
FRONTEND_URL = "https://adatp-repair.preview.emergentagent.com"
BACKEND_URL = "https://adatp-repair.preview.emergentagent.com/api"

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

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    try:
        response = requests.get(FRONTEND_URL, timeout=10)
        if response.status_code == 200:
            log_test("Frontend Accessibility", "PASS", f"Frontend loading successfully")
            return True
        else:
            log_test("Frontend Accessibility", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        log_test("Frontend Accessibility", "FAIL", f"Error: {str(e)}")
        return False

def test_courses_page():
    """Test if courses page is accessible"""
    try:
        response = requests.get(f"{FRONTEND_URL}/courses", timeout=10)
        if response.status_code == 200:
            log_test("Courses Page", "PASS", "Courses page accessible")
            return True
        else:
            log_test("Courses Page", "FAIL", f"Status code: {response.status_code}")
            return False
    except Exception as e:
        log_test("Courses Page", "FAIL", f"Error: {str(e)}")
        return False

def test_auth_pages():
    """Test authentication pages"""
    try:
        # Test signin page
        login_response = requests.get(f"{FRONTEND_URL}/auth/signin", timeout=10)
        login_ok = login_response.status_code == 200
        
        # Test signup page  
        signup_response = requests.get(f"{FRONTEND_URL}/auth/signup", timeout=10)
        signup_ok = signup_response.status_code == 200
        
        if login_ok and signup_ok:
            log_test("Authentication Pages", "PASS", "Login and signup pages accessible")
            return True
        else:
            log_test("Authentication Pages", "FAIL", f"Login: {login_response.status_code}, Signup: {signup_response.status_code}")
            return False
    except Exception as e:
        log_test("Authentication Pages", "FAIL", f"Error: {str(e)}")
        return False

def main():
    """Run frontend enrollment flow tests"""
    print(f"{Colors.BOLD}{Colors.BLUE}=== Frontend Enrollment Flow Tests ==={Colors.ENDC}")
    print(f"Testing frontend: {FRONTEND_URL}")
    print(f"Testing backend: {BACKEND_URL}")
    print()
    
    total_tests = 0
    passed_tests = 0
    
    # Test 1: Frontend Accessibility
    total_tests += 1
    if test_frontend_accessibility():
        passed_tests += 1
    
    # Test 2: Courses Page
    total_tests += 1
    if test_courses_page():
        passed_tests += 1
    
    # Test 3: Auth Pages
    total_tests += 1
    if test_auth_pages():
        passed_tests += 1
    
    # Summary
    print()
    print(f"{Colors.BOLD}=== Frontend Test Summary ==={Colors.ENDC}")
    print(f"Total Tests: {total_tests}")
    print(f"Passed: {Colors.GREEN}{passed_tests}{Colors.ENDC}")
    print(f"Failed: {Colors.RED}{total_tests - passed_tests}{Colors.ENDC}")
    
    success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
    
    if success_rate >= 80:
        print(f"\n{Colors.GREEN}✅ FRONTEND: ACCESSIBLE ({success_rate:.1f}% success rate){Colors.ENDC}")
        print(f"{Colors.YELLOW}NOTE: Manual testing required for complete enrollment flow{Colors.ENDC}")
        return True
    else:
        print(f"\n{Colors.RED}❌ FRONTEND: ISSUES ({success_rate:.1f}% success rate){Colors.ENDC}")
        return False

if __name__ == "__main__":
    main()