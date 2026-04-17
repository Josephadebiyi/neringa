#!/usr/bin/env python3
"""
Bago Push Notification Backend Test
Tests all push notification related functionality and configuration
"""

import requests
import json
import sys
import time
from datetime import datetime
import os

class BagoPushNotificationTester:
    def __init__(self):
        # Use the production URL from Flutter constants
        self.base_url = "https://neringa.onrender.com"
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
    
    def test_backend_connectivity(self):
        """Test 1: Verify backend is accessible"""
        print("\n🔍 Testing Backend Connectivity...")
        
        try:
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                self.log_test("Backend Health Check", True, f"Status: {response.status_code}")
            else:
                self.log_test("Backend Health Check", False, f"Status: {response.status_code}", True)
        except requests.exceptions.RequestException as e:
            self.log_test("Backend Health Check", False, f"Connection failed: {str(e)}", True)
    
    def test_push_token_endpoint(self):
        """Test 2: Verify push token registration endpoint"""
        print("\n🔍 Testing Push Token Registration Endpoint...")
        
        try:
            # Test the push-token endpoint from api_constants.dart
            response = requests.post(f"{self.api_base}/push-token", 
                                   json={
                                       "token": "test-fcm-token-12345",
                                       "platform": "ios"
                                   }, 
                                   timeout=10)
            
            # We expect 401 (unauthorized) since we don't have a valid token
            # But the endpoint should exist
            if response.status_code in [200, 201, 400, 401, 422]:
                self.log_test("Push Token Endpoint Exists", True, f"Endpoint accessible (status: {response.status_code})")
                
                # Check if response is JSON
                try:
                    data = response.json()
                    if 'success' in data or 'message' in data:
                        self.log_test("Push Token Response Format", True, "Returns proper JSON response")
                    else:
                        self.log_test("Push Token Response Format", False, "Unexpected JSON structure")
                except:
                    self.log_test("Push Token Response Format", False, "Non-JSON response")
                    
            elif response.status_code == 404:
                self.log_test("Push Token Endpoint Exists", False, "Endpoint not found", True)
            else:
                self.log_test("Push Token Endpoint Exists", True, f"Unexpected status: {response.status_code}")
                
        except Exception as e:
            self.log_test("Push Token Endpoint", False, f"Error: {str(e)}", True)
    
    def test_auth_endpoints_for_push(self):
        """Test 3: Test auth endpoints needed for push token registration"""
        print("\n🔍 Testing Auth Endpoints for Push Registration...")
        
        # Test signin endpoint
        try:
            response = requests.post(f"{self.api_base}/signin", 
                                   json={"email": "test@example.com", "password": "invalid"}, 
                                   timeout=10)
            if response.status_code in [400, 401, 422]:
                self.log_test("Signin Endpoint", True, f"Endpoint exists (status: {response.status_code})")
            elif response.status_code == 404:
                self.log_test("Signin Endpoint", False, "Endpoint not found", True)
            else:
                self.log_test("Signin Endpoint", True, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Signin Endpoint", False, f"Error: {str(e)}")
        
        # Test getuser endpoint (profile)
        try:
            response = requests.get(f"{self.api_base}/getuser", timeout=10)
            if response.status_code in [401, 403]:  # Expected without auth
                self.log_test("Get User Endpoint", True, f"Endpoint exists (status: {response.status_code})")
            elif response.status_code == 404:
                self.log_test("Get User Endpoint", False, "Endpoint not found", True)
            else:
                self.log_test("Get User Endpoint", True, f"Status: {response.status_code}")
        except Exception as e:
            self.log_test("Get User Endpoint", False, f"Error: {str(e)}")
    
    def verify_flutter_push_service_implementation(self):
        """Test 4: Verify Flutter push notification service implementation"""
        print("\n🔍 Verifying Flutter Push Service Implementation...")
        
        # Check 2-second delay after permission request
        try:
            with open('/app/lib/shared/services/push_notification_service.dart', 'r') as f:
                content = f.read()
            
            if 'Duration(seconds: 2)' in content and 'await Future<void>.delayed' in content:
                self.log_test("2-Second Delay After Permission", True, "Found 2-second delay implementation")
            else:
                self.log_test("2-Second Delay After Permission", False, "2-second delay not found")
        except Exception as e:
            self.log_test("2-Second Delay After Permission", False, f"Error: {str(e)}")
        
        # Check APNs token readiness check before FCM getToken on iOS
        try:
            with open('/app/lib/shared/services/push_notification_service.dart', 'r') as f:
                content = f.read()
            
            if 'getAPNSToken()' in content and 'defaultTargetPlatform == TargetPlatform.iOS' in content:
                self.log_test("APNs Token Readiness Check", True, "Found APNs token check before FCM")
            else:
                self.log_test("APNs Token Readiness Check", False, "APNs token check not found")
        except Exception as e:
            self.log_test("APNs Token Readiness Check", False, f"Error: {str(e)}")
        
        # Check APNs token fallback when FCM getToken fails
        try:
            with open('/app/lib/shared/services/push_notification_service.dart', 'r') as f:
                content = f.read()
            
            if 'APNs fallback' in content or ('getAPNSToken()' in content and 'fallback' in content):
                self.log_test("APNs Token Fallback", True, "Found APNs fallback implementation")
            else:
                self.log_test("APNs Token Fallback", False, "APNs fallback not found")
        except Exception as e:
            self.log_test("APNs Token Fallback", False, f"Error: {str(e)}")
        
        # Check 8 retry attempts for syncFirebaseToken
        try:
            with open('/app/lib/shared/services/push_notification_service.dart', 'r') as f:
                content = f.read()
            
            if 'attempt <= 8' in content or 'for (var attempt = 1; attempt <= 8' in content:
                self.log_test("8 Retry Attempts", True, "Found 8 retry attempts for token sync")
            else:
                self.log_test("8 Retry Attempts", False, "8 retry attempts not found")
        except Exception as e:
            self.log_test("8 Retry Attempts", False, f"Error: {str(e)}")
        
        # Check native MethodChannel tokens don't conflict with Firebase path
        try:
            with open('/app/lib/shared/services/push_notification_service.dart', 'r') as f:
                content = f.read()
            
            if 'Firebase active — native APNs token noted but FCM path preferred' in content:
                self.log_test("Native Token Conflict Prevention", True, "Found conflict prevention logic")
            else:
                self.log_test("Native Token Conflict Prevention", False, "Conflict prevention not found")
        except Exception as e:
            self.log_test("Native Token Conflict Prevention", False, f"Error: {str(e)}")
    
    def verify_flutter_main_background_handler(self):
        """Test 5: Verify Flutter main.dart background message handler"""
        print("\n🔍 Verifying Flutter Background Message Handler...")
        
        try:
            with open('/app/lib/main.dart', 'r') as f:
                content = f.read()
            
            # Check background message handler is registered
            if 'FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler)' in content:
                self.log_test("Background Message Handler Registration", True, "Handler registered in main.dart")
            else:
                self.log_test("Background Message Handler Registration", False, "Handler registration not found")
            
            # Check _firebaseMessagingBackgroundHandler is a top-level function
            if '@pragma(\'vm:entry-point\')' in content and 'Future<void> _firebaseMessagingBackgroundHandler' in content:
                self.log_test("Top-Level Background Handler", True, "Handler is top-level function with pragma")
            else:
                self.log_test("Top-Level Background Handler", False, "Handler not properly defined as top-level")
                
        except Exception as e:
            self.log_test("Background Message Handler", False, f"Error: {str(e)}")
    
    def verify_backend_push_implementation(self):
        """Test 6: Verify backend push notification implementation"""
        print("\n🔍 Verifying Backend Push Implementation...")
        
        # Check savePushToken logs token details and verifies storage
        try:
            with open('/app/BAGO_BACKEND/controllers/postgresUserController.js', 'r') as f:
                content = f.read()
            
            if 'console.log' in content and 'savePushToken' in content and 'Token stored:' in content:
                self.log_test("Backend Token Logging", True, "Found token logging in savePushToken")
            else:
                self.log_test("Backend Token Logging", False, "Token logging not found in savePushToken")
        except Exception as e:
            self.log_test("Backend Token Logging", False, f"Error: {str(e)}")
        
        # Check addPushToken has RETURNING clause and updated_at update
        try:
            with open('/app/BAGO_BACKEND/lib/postgres/profiles.js', 'r') as f:
                content = f.read()
            
            returning_found = 'returning id, array_length(push_tokens, 1)' in content
            updated_at_found = 'updated_at = timezone(\'utc\', now())' in content
            
            if returning_found and updated_at_found:
                self.log_test("Backend SQL RETURNING and updated_at", True, "Found RETURNING clause and updated_at")
            else:
                self.log_test("Backend SQL RETURNING and updated_at", False, f"RETURNING: {returning_found}, updated_at: {updated_at_found}")
        except Exception as e:
            self.log_test("Backend SQL Implementation", False, f"Error: {str(e)}")
    
    def verify_android_configuration(self):
        """Test 7: Verify Android FCM configuration"""
        print("\n🔍 Verifying Android Configuration...")
        
        # Check google-services.json exists
        try:
            if os.path.exists('/app/android/app/google-services.json'):
                with open('/app/android/app/google-services.json', 'r') as f:
                    config = json.load(f)
                
                if config.get('project_info', {}).get('project_id') == 'bago-broadcast':
                    self.log_test("Android google-services.json", True, "Valid config file exists")
                else:
                    self.log_test("Android google-services.json", False, "Invalid project_id in config")
            else:
                self.log_test("Android google-services.json", False, "Config file not found", True)
        except Exception as e:
            self.log_test("Android google-services.json", False, f"Error: {str(e)}")
        
        # Check google-services plugin in gradle files
        try:
            with open('/app/android/app/build.gradle.kts', 'r') as f:
                app_gradle = f.read()
            
            with open('/app/android/settings.gradle.kts', 'r') as f:
                settings_gradle = f.read()
            
            app_has_plugin = 'com.google.gms.google-services' in app_gradle
            settings_has_plugin = 'com.google.gms.google-services' in settings_gradle
            
            if app_has_plugin and settings_has_plugin:
                self.log_test("Android Gradle Plugins", True, "Google services plugin in both gradle files")
            else:
                self.log_test("Android Gradle Plugins", False, f"App: {app_has_plugin}, Settings: {settings_has_plugin}")
        except Exception as e:
            self.log_test("Android Gradle Plugins", False, f"Error: {str(e)}")
        
        # Check AndroidManifest.xml has FCM metadata
        try:
            with open('/app/android/app/src/main/AndroidManifest.xml', 'r') as f:
                manifest = f.read()
            
            required_metadata = [
                'com.google.firebase.messaging.default_notification_channel_id',
                'com.google.firebase.messaging.default_notification_icon'
            ]
            
            found_metadata = [meta for meta in required_metadata if meta in manifest]
            
            if len(found_metadata) == len(required_metadata):
                self.log_test("Android FCM Metadata", True, "All FCM metadata found in manifest")
            else:
                missing = set(required_metadata) - set(found_metadata)
                self.log_test("Android FCM Metadata", False, f"Missing metadata: {missing}")
        except Exception as e:
            self.log_test("Android FCM Metadata", False, f"Error: {str(e)}")
    
    def verify_ios_configuration(self):
        """Test 8: Verify iOS FCM configuration"""
        print("\n🔍 Verifying iOS Configuration...")
        
        # Check GoogleService-Info.plist has IS_GCM_ENABLED true
        try:
            with open('/app/ios/Runner/GoogleService-Info.plist', 'r') as f:
                plist_content = f.read()
            
            if '<key>IS_GCM_ENABLED</key>' in plist_content and '<true></true>' in plist_content:
                self.log_test("iOS IS_GCM_ENABLED", True, "IS_GCM_ENABLED is true in GoogleService-Info.plist")
            else:
                self.log_test("iOS IS_GCM_ENABLED", False, "IS_GCM_ENABLED not properly set")
        except Exception as e:
            self.log_test("iOS IS_GCM_ENABLED", False, f"Error: {str(e)}")
        
        # Check Runner.entitlements has aps-environment
        try:
            with open('/app/ios/Runner/Runner.entitlements', 'r') as f:
                entitlements = f.read()
            
            if '<key>aps-environment</key>' in entitlements and '<string>production</string>' in entitlements:
                self.log_test("iOS aps-environment", True, "aps-environment set to production")
            else:
                self.log_test("iOS aps-environment", False, "aps-environment not properly configured")
        except Exception as e:
            self.log_test("iOS aps-environment", False, f"Error: {str(e)}")
        
        # Check Info.plist has remote-notification background mode
        try:
            with open('/app/ios/Runner/Info.plist', 'r') as f:
                info_plist = f.read()
            
            if '<key>UIBackgroundModes</key>' in info_plist and '<string>remote-notification</string>' in info_plist:
                self.log_test("iOS Background Mode", True, "remote-notification background mode configured")
            else:
                self.log_test("iOS Background Mode", False, "remote-notification background mode not found")
        except Exception as e:
            self.log_test("iOS Background Mode", False, f"Error: {str(e)}")
    
    def run_all_tests(self):
        """Run all tests and generate report"""
        print("🚀 Starting Bago Push Notification Test Suite")
        print(f"📍 Testing backend at: {self.base_url}")
        print("=" * 60)
        
        # Run all test categories
        self.test_backend_connectivity()
        self.test_push_token_endpoint()
        self.test_auth_endpoints_for_push()
        self.verify_flutter_push_service_implementation()
        self.verify_flutter_main_background_handler()
        self.verify_backend_push_implementation()
        self.verify_android_configuration()
        self.verify_ios_configuration()
        
        # Generate final report
        print("\n" + "=" * 60)
        print("📊 PUSH NOTIFICATION TEST SUMMARY")
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
            print("\n✅ Push notification implementation looks good!")
            print("🎉 Ready for iOS/Android push notification testing")
        else:
            print(f"\n❌ {len(self.critical_failures)} critical issues need to be fixed")
            return 1
            
        return 0

def main():
    """Main test execution"""
    tester = BagoPushNotificationTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())