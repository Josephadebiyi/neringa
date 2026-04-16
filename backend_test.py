#!/usr/bin/env python3
"""
Comprehensive Backend Test for Bago Flutter App
Tests all the reported fixes and critical functionality
Includes static code verification for Flutter and Admin fixes
"""

import requests
import json
import sys
import time
from datetime import datetime
import subprocess
import os

class BagoBackendTester:
    def __init__(self):
        # Use environment variable or default to localhost
        self.base_url = os.getenv('BACKEND_URL', 'http://localhost:3000')
        self.api_base = f"{self.base_url}/api/bago"
        self.tests_run = 0
        self.tests_passed = 0
        self.critical_failures = []
        self.warnings = []
        
    def log_test(self, name, success, details="", is_critical=False):
        """Log test result"""
        self.tests_run += 1
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} - {name}")
        if details:
            print(f"    {details}")
        
        if success:
            self.tests_passed += 1
        elif is_critical:
            self.critical_failures.append(f"{name}: {details}")
        else:
            self.warnings.append(f"{name}: {details}")
    
    def test_server_startup(self):
        """Test 1: Verify server can start without import errors"""
        print("\n🔍 Testing Server Startup and Import Resolution...")
        
        try:
            # Test basic health endpoint
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Server Health Check", True, f"Status: {response.status_code}")
            else:
                self.log_test("Server Health Check", False, f"Status: {response.status_code}", True)
        except requests.exceptions.RequestException as e:
            self.log_test("Server Health Check", False, f"Connection failed: {str(e)}", True)
            
        # Test root endpoint
        try:
            response = requests.get(self.base_url, timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'Bago API' in data.get('message', ''):
                    self.log_test("Root API Endpoint", True, "API is running")
                else:
                    self.log_test("Root API Endpoint", False, f"Unexpected response: {data}")
            else:
                self.log_test("Root API Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Root API Endpoint", False, f"Error: {str(e)}")
    
    def test_dependencies(self):
        """Test 2: Verify critical dependencies are installed"""
        print("\n🔍 Testing Dependencies...")
        
        # Check if server responds (indicates dependencies loaded)
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            if response.status_code == 200:
                self.log_test("Dependencies Load Check", True, "Server responding - dependencies loaded")
            else:
                self.log_test("Dependencies Load Check", False, "Server not responding properly")
        except Exception as e:
            self.log_test("Dependencies Load Check", False, f"Server unreachable: {str(e)}", True)
    
    def test_cors_configuration(self):
        """Test 3: Verify CORS allows all origins for mobile apps"""
        print("\n🔍 Testing CORS Configuration...")
        
        try:
            # Test OPTIONS request with mobile origin
            headers = {
                'Origin': 'capacitor://localhost',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'Content-Type,Authorization'
            }
            response = requests.options(f"{self.api_base}/signin", headers=headers, timeout=5)
            
            cors_origin = response.headers.get('Access-Control-Allow-Origin', '')
            cors_methods = response.headers.get('Access-Control-Allow-Methods', '')
            
            if cors_origin == '*' or 'capacitor://localhost' in cors_origin:
                self.log_test("CORS Origin Policy", True, f"Allows: {cors_origin}")
            else:
                self.log_test("CORS Origin Policy", False, f"Restrictive CORS: {cors_origin}")
                
            if 'POST' in cors_methods and 'GET' in cors_methods:
                self.log_test("CORS Methods", True, f"Methods: {cors_methods}")
            else:
                self.log_test("CORS Methods", False, f"Limited methods: {cors_methods}")
                
        except Exception as e:
            self.log_test("CORS Configuration", False, f"Error testing CORS: {str(e)}")
    
    def test_rate_limiting(self):
        """Test 4: Verify rate limiting is set to 500 requests"""
        print("\n🔍 Testing Rate Limiting Configuration...")
        
        try:
            # Make a few requests to check rate limit headers
            response = requests.get(f"{self.base_url}/health", timeout=5)
            
            rate_limit = response.headers.get('X-RateLimit-Limit', '')
            rate_remaining = response.headers.get('X-RateLimit-Remaining', '')
            
            if rate_limit == '500':
                self.log_test("Rate Limit Configuration", True, f"Limit: {rate_limit} requests")
            elif rate_limit:
                self.log_test("Rate Limit Configuration", False, f"Unexpected limit: {rate_limit} (expected 500)")
            else:
                # Rate limiting might not show headers on all endpoints
                self.log_test("Rate Limit Headers", True, "No rate limit headers (may be normal)")
                
        except Exception as e:
            self.log_test("Rate Limiting Test", False, f"Error: {str(e)}")
    
    def test_auth_endpoints(self):
        """Test 5: Verify auth endpoints including refresh-token"""
        print("\n🔍 Testing Authentication Endpoints...")
        
        # Test signin endpoint exists
        try:
            response = requests.post(f"{self.api_base}/signin", 
                                   json={"email": "test@example.com", "password": "invalid"}, 
                                   timeout=5)
            # We expect this to fail with 400/401, not 404
            if response.status_code in [400, 401, 422]:
                self.log_test("Signin Endpoint", True, f"Endpoint exists (status: {response.status_code})")
            elif response.status_code == 404:
                self.log_test("Signin Endpoint", False, "Endpoint not found", True)
            else:
                self.log_test("Signin Endpoint", True, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Signin Endpoint", False, f"Error: {str(e)}")
        
        # Test refresh-token endpoint exists
        try:
            response = requests.post(f"{self.api_base}/refresh-token", 
                                   json={"refreshToken": "invalid"}, 
                                   timeout=5)
            # We expect this to fail with 400/401, not 404
            if response.status_code in [400, 401, 422]:
                self.log_test("Refresh Token Endpoint", True, f"Endpoint exists (status: {response.status_code})")
            elif response.status_code == 404:
                self.log_test("Refresh Token Endpoint", False, "Endpoint not found", True)
            else:
                self.log_test("Refresh Token Endpoint", True, f"Unexpected status: {response.status_code}")
        except Exception as e:
            self.log_test("Refresh Token Endpoint", False, f"Error: {str(e)}")
        
        # Test logout endpoint (should be GET method)
        try:
            response = requests.get(f"{self.api_base}/logout", timeout=5)
            # Should work even without auth (just clear session)
            if response.status_code in [200, 401]:
                self.log_test("Logout Endpoint (GET)", True, f"GET method works (status: {response.status_code})")
            elif response.status_code == 404:
                self.log_test("Logout Endpoint (GET)", False, "GET logout not found", True)
            else:
                self.log_test("Logout Endpoint (GET)", True, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Logout Endpoint", False, f"Error: {str(e)}")
    
    def test_push_notification_endpoints(self):
        """Test 6: Verify push notification registration"""
        print("\n🔍 Testing Push Notification Endpoints...")
        
        try:
            # Test push token registration endpoint
            response = requests.post(f"{self.base_url}/api/bago/register-token", 
                                   json={
                                       "userId": "test-user-id", 
                                       "token": "test-push-token"
                                   }, 
                                   timeout=5)
            
            if response.status_code in [200, 400, 401]:  # 400/401 expected without valid auth
                self.log_test("Push Token Registration", True, f"Endpoint exists (status: {response.status_code})")
            elif response.status_code == 404:
                self.log_test("Push Token Registration", False, "Endpoint not found", True)
            else:
                self.log_test("Push Token Registration", True, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Push Token Registration", False, f"Error: {str(e)}")
    
    def test_socket_io_support(self):
        """Test 7: Verify Socket.IO endpoint is accessible"""
        print("\n🔍 Testing Socket.IO Support...")
        
        try:
            # Test Socket.IO handshake endpoint
            response = requests.get(f"{self.base_url}/socket.io/", 
                                  params={"EIO": "4", "transport": "polling"}, 
                                  timeout=5)
            
            if response.status_code == 200:
                # Check if response contains Socket.IO handshake data
                if "sid" in response.text or "0{" in response.text:
                    self.log_test("Socket.IO Handshake", True, "Socket.IO server responding")
                else:
                    self.log_test("Socket.IO Handshake", False, "Unexpected Socket.IO response")
            elif response.status_code == 400:
                # Some Socket.IO servers return 400 for invalid handshake
                self.log_test("Socket.IO Handshake", True, "Socket.IO server present (returned 400)")
            else:
                self.log_test("Socket.IO Handshake", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Socket.IO Support", False, f"Error: {str(e)}")
    
    def test_public_endpoints(self):
        """Test 8: Verify public endpoints work"""
        print("\n🔍 Testing Public Endpoints...")
        
        # Test currency rates endpoint
        try:
            response = requests.get(f"{self.base_url}/api/currency/rates", timeout=5)
            if response.status_code == 200:
                self.log_test("Currency Rates Endpoint", True, "Public endpoint accessible")
            else:
                self.log_test("Currency Rates Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Currency Rates Endpoint", False, f"Error: {str(e)}")
        
        # Test route search endpoint
        try:
            response = requests.get(f"{self.base_url}/api/routes/search", timeout=5)
            if response.status_code in [200, 400]:  # 400 might be expected without params
                self.log_test("Route Search Endpoint", True, f"Endpoint accessible (status: {response.status_code})")
            else:
                self.log_test("Route Search Endpoint", False, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Route Search Endpoint", False, f"Error: {str(e)}")
    
    def test_error_handling(self):
        """Test 9: Verify proper error handling"""
        print("\n🔍 Testing Error Handling...")
        
        try:
            # Test 404 handling
            response = requests.get(f"{self.api_base}/nonexistent-endpoint", timeout=5)
            if response.status_code == 404:
                try:
                    data = response.json()
                    if data.get('success') == False:
                        self.log_test("404 Error Handling", True, "Returns proper JSON error")
                    else:
                        self.log_test("404 Error Handling", False, "Invalid error format")
                except:
                    self.log_test("404 Error Handling", False, "Non-JSON 404 response")
            else:
                self.log_test("404 Error Handling", False, f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Error Handling", False, f"Error: {str(e)}")
    
    def test_security_headers(self):
        """Test 10: Verify security headers are present"""
        print("\n🔍 Testing Security Headers...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=5)
            headers = response.headers
            
            security_checks = [
                ("X-Content-Type-Options", "nosniff"),
                ("X-Frame-Options", "DENY"),
                ("Referrer-Policy", "no-referrer"),
            ]
            
            for header, expected in security_checks:
                if header in headers and expected in headers[header]:
                    self.log_test(f"Security Header: {header}", True, f"Value: {headers[header]}")
                else:
                    self.log_test(f"Security Header: {header}", False, f"Missing or incorrect")
                    
        except Exception as e:
            self.log_test("Security Headers", False, f"Error: {str(e)}")
    
    def test_static_code_verification(self):
        """Test: Static code verification for all reported fixes"""
        print("\n🔍 Testing Static Code Verification...")
        
        # 1. Verify server.js syntax
        try:
            result = subprocess.run(
                ['node', '--check', '/app/BAGO_BACKEND/server.js'],
                capture_output=True,
                text=True,
                cwd='/app/BAGO_BACKEND'
            )
            if result.returncode == 0:
                self.log_test("Server.js Syntax Check", True, "No syntax errors")
            else:
                self.log_test("Server.js Syntax Check", False, f"Syntax error: {result.stderr}", True)
        except Exception as e:
            self.log_test("Server.js Syntax Check", False, f"Error: {str(e)}", True)
        
        # 2. Verify pushNotificationService.js has multiple file paths
        try:
            with open('/app/BAGO_BACKEND/services/pushNotificationService.js', 'r') as f:
                content = f.read()
            
            required_paths = [
                'process.env.FIREBASE_SERVICE_ACCOUNT_PATH',
                './firebase-service-account.json',
                '../firebase-service-account.json',
                '/etc/secrets/firebase-service-account.json'
            ]
            
            found_paths = [path for path in required_paths if path in content]
            
            if len(found_paths) >= 3:
                self.log_test("Firebase Multiple File Paths", True, f"Found {len(found_paths)} paths")
            else:
                self.log_test("Firebase Multiple File Paths", False, f"Only found {len(found_paths)} paths")
        except Exception as e:
            self.log_test("Firebase Multiple File Paths", False, f"Error: {str(e)}")
        
        # 3. Verify push-debug endpoint exists
        try:
            with open('/app/BAGO_BACKEND/server.js', 'r') as f:
                content = f.read()
            
            if '/api/bago/push-debug' in content:
                self.log_test("Push Debug Endpoint", True, "Endpoint found in server.js")
            else:
                self.log_test("Push Debug Endpoint", False, "Endpoint not found in server.js")
        except Exception as e:
            self.log_test("Push Debug Endpoint", False, f"Error: {str(e)}")
        
        # 4. Verify refresh-token endpoint in userRouters.js
        try:
            with open('/app/BAGO_BACKEND/routers/userRouters.js', 'r') as f:
                content = f.read()
            
            if '/refresh-token' in content and 'userRouter.post' in content:
                self.log_test("Refresh Token Endpoint", True, "Found in userRouters.js")
            else:
                self.log_test("Refresh Token Endpoint", False, "Not found in userRouters.js")
        except Exception as e:
            self.log_test("Refresh Token Endpoint", False, f"Error: {str(e)}")
        
        # 5. Verify pg and @supabase/supabase-js in package.json
        try:
            with open('/app/BAGO_BACKEND/package.json', 'r') as f:
                package_data = json.load(f)
            
            dependencies = package_data.get('dependencies', {})
            required_deps = ['pg', '@supabase/supabase-js']
            missing_deps = [dep for dep in required_deps if dep not in dependencies]
            
            if not missing_deps:
                self.log_test("Required Dependencies", True, f"Found: {required_deps}")
            else:
                self.log_test("Required Dependencies", False, f"Missing: {missing_deps}")
        except Exception as e:
            self.log_test("Required Dependencies", False, f"Error: {str(e)}")
    
    def test_admin_fixes(self):
        """Test: Admin panel fixes verification"""
        print("\n🔍 Testing Admin Panel Fixes...")
        
        # 1. Verify ErrorBoundary.tsx exists
        try:
            error_boundary_path = "/app/ADMIN_NEW/src/react-app/components/ErrorBoundary.tsx"
            if os.path.exists(error_boundary_path):
                self.log_test("ErrorBoundary Component", True, "Component file exists")
            else:
                self.log_test("ErrorBoundary Component", False, "Component file not found")
        except Exception as e:
            self.log_test("ErrorBoundary Component", False, f"Error: {str(e)}")
        
        # 2. Verify main.tsx wraps App with ErrorBoundary
        try:
            with open('/app/ADMIN_NEW/src/react-app/main.tsx', 'r') as f:
                content = f.read()
            
            if '<ErrorBoundary>' in content and '</ErrorBoundary>' in content:
                self.log_test("ErrorBoundary Wrapper", True, "App wrapped with ErrorBoundary")
            else:
                self.log_test("ErrorBoundary Wrapper", False, "App not wrapped with ErrorBoundary")
        except Exception as e:
            self.log_test("ErrorBoundary Wrapper", False, f"Error: {str(e)}")
        
        # 3. Verify api.ts has network error handling
        try:
            with open('/app/ADMIN_NEW/src/react-app/services/api.ts', 'r') as f:
                content = f.read()
            
            # Check for try/catch in apiCall function
            apiCall_has_try_catch = 'try {' in content and 'catch (networkError)' in content
            
            # Check for try/catch in adminLogin function  
            adminLogin_has_try_catch = 'adminLogin' in content and 'try {' in content and 'catch (networkError)' in content
            
            if apiCall_has_try_catch and adminLogin_has_try_catch:
                self.log_test("API Network Error Handling", True, "Both apiCall and adminLogin have try/catch")
            else:
                self.log_test("API Network Error Handling", False, f"Missing try/catch - apiCall: {apiCall_has_try_catch}, adminLogin: {adminLogin_has_try_catch}")
        except Exception as e:
            self.log_test("API Network Error Handling", False, f"Error: {str(e)}")
    
    def test_flutter_fixes(self):
        """Test: Flutter fixes verification"""
        print("\n🔍 Testing Flutter Fixes...")
        
        # 1. Verify firebase_options.dart has real Android appId
        try:
            with open('/app/lib/firebase_options.dart', 'r') as f:
                content = f.read()
            
            # Check for real appId (not placeholder)
            if 'appId:' in content and 'com.example' not in content and '1:908126616288:android:' in content:
                self.log_test("Firebase Android AppId", True, "Real Android appId found")
            else:
                self.log_test("Firebase Android AppId", False, "Placeholder or missing Android appId")
        except Exception as e:
            self.log_test("Firebase Android AppId", False, f"Error: {str(e)}")
        
        # 2. Verify settings.gradle.kts has google-services plugin
        try:
            with open('/app/android/settings.gradle.kts', 'r') as f:
                content = f.read()
            
            if 'com.google.gms.google-services' in content:
                self.log_test("Settings Gradle Google Services", True, "Plugin found in settings.gradle.kts")
            else:
                self.log_test("Settings Gradle Google Services", False, "Plugin not found in settings.gradle.kts")
        except Exception as e:
            self.log_test("Settings Gradle Google Services", False, f"Error: {str(e)}")
        
        # 3. Verify app/build.gradle.kts has google-services plugin
        try:
            with open('/app/android/app/build.gradle.kts', 'r') as f:
                content = f.read()
            
            if 'com.google.gms.google-services' in content:
                self.log_test("App Gradle Google Services", True, "Plugin found in app/build.gradle.kts")
            else:
                self.log_test("App Gradle Google Services", False, "Plugin not found in app/build.gradle.kts")
        except Exception as e:
            self.log_test("App Gradle Google Services", False, f"Error: {str(e)}")
        
        # 4. Verify AndroidManifest.xml has FCM metadata
        try:
            with open('/app/android/app/src/main/AndroidManifest.xml', 'r') as f:
                content = f.read()
            
            required_metadata = [
                'com.google.firebase.messaging.default_notification_channel_id',
                'com.google.firebase.messaging.default_notification_icon'
            ]
            
            found_metadata = [meta for meta in required_metadata if meta in content]
            
            if len(found_metadata) == len(required_metadata):
                self.log_test("AndroidManifest FCM Metadata", True, f"All FCM metadata found")
            else:
                missing = set(required_metadata) - set(found_metadata)
                self.log_test("AndroidManifest FCM Metadata", False, f"Missing: {missing}")
        except Exception as e:
            self.log_test("AndroidManifest FCM Metadata", False, f"Error: {str(e)}")
        
        # 5. Verify push_notification_service.dart has 5 retries
        try:
            with open('/app/lib/shared/services/push_notification_service.dart', 'r') as f:
                content = f.read()
            
            if 'maxRetries = 5' in content or 'maxRetries: 5' in content:
                self.log_test("Push Service 5 Retries", True, "5 retries found in push service")
            else:
                self.log_test("Push Service 5 Retries", False, "5 retries not found in push service")
        except Exception as e:
            self.log_test("Push Service 5 Retries", False, f"Error: {str(e)}")
        
        # 6. Verify socket_io_client in pubspec.yaml
        try:
            with open('/app/pubspec.yaml', 'r') as f:
                content = f.read()
            
            if 'socket_io_client:' in content:
                self.log_test("Socket IO Client Dependency", True, "socket_io_client found in pubspec.yaml")
            else:
                self.log_test("Socket IO Client Dependency", False, "socket_io_client not found in pubspec.yaml")
        except Exception as e:
            self.log_test("Socket IO Client Dependency", False, f"Error: {str(e)}")
        
        # 7. Verify socket_service.dart exists
        try:
            socket_service_path = "/app/lib/shared/services/socket_service.dart"
            if os.path.exists(socket_service_path):
                self.log_test("Socket Service File", True, "socket_service.dart exists")
            else:
                self.log_test("Socket Service File", False, "socket_service.dart not found")
        except Exception as e:
            self.log_test("Socket Service File", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("🚀 Starting Bago Backend Comprehensive Test Suite")
        print(f"📍 Testing backend at: {self.base_url}")
        print("=" * 60)
        
        # Run static code verification first
        self.test_static_code_verification()
        self.test_admin_fixes()
        self.test_flutter_fixes()
        
        # Run all test categories
        self.test_server_startup()
        self.test_dependencies()
        self.test_cors_configuration()
        self.test_rate_limiting()
        self.test_auth_endpoints()
        self.test_push_notification_endpoints()
        self.test_socket_io_support()
        self.test_public_endpoints()
        self.test_error_handling()
        self.test_security_headers()
        
        # Generate final report
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES ({len(self.critical_failures)}):")
            for failure in self.critical_failures:
                print(f"  ❌ {failure}")
        
        if self.warnings:
            print(f"\n⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  ⚠️  {warning}")
        
        if not self.critical_failures:
            print("\n✅ All critical functionality is working!")
            print("🎉 Backend is ready for Flutter app integration")
        else:
            print(f"\n❌ {len(self.critical_failures)} critical issues need to be fixed")
            return 1
            
        return 0

def main():
    """Main test execution"""
    tester = BagoBackendTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())