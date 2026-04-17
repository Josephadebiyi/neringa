#!/usr/bin/env python3
"""
Bago Push Notification & Feature Testing Suite
Tests specific features mentioned in the review request:
1. Push notifications for accepted/rejected trips + new messages
2. Backend API functionality
3. Static code review for Flutter components
"""

import requests
import sys
import json
import time
import os
from datetime import datetime

class BagoPushNotificationTester:
    def __init__(self):
        self.base_url = self._get_backend_url()
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []
        self.backend_issues = []
        self.frontend_issues = []
        self.test_results = {}
        
    def _get_backend_url(self) -> str:
        """Get backend URL from frontend .env file"""
        try:
            with open('/app/frontend/.env', 'r') as f:
                for line in f:
                    if line.startswith('REACT_APP_BACKEND_URL='):
                        return line.split('=', 1)[1].strip().strip('"\'')
        except:
            pass
        return "http://localhost:8001"  # fallback
    
    def log_test(self, name: str, success: bool, details: str = "", error: str = ""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            self.passed_tests.append(name)
            print(f"✅ {name}: {details}")
        else:
            self.failed_tests.append(name)
            if "backend" in name.lower() or "api" in name.lower() or "server" in name.lower():
                self.backend_issues.append({
                    "test": name,
                    "issue": error or details,
                    "fix_priority": "HIGH"
                })
            else:
                self.frontend_issues.append({
                    "test": name,
                    "issue": error or details,
                    "fix_priority": "MEDIUM"
                })
            print(f"❌ {name}: {error or details}")
        
        self.test_results[name] = {
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }

    def test_backend_server_loads(self):
        """Test: Backend server.js loads without syntax errors"""
        print("\n🔍 Testing Backend Server Loading...")
        
        try:
            # Test server health endpoint
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                data = response.json()
                if data.get('status') == 'ok':
                    self.log_test("Backend Server Loads", True, "server.js loads without syntax errors and responds to health check")
                else:
                    self.log_test("Backend Server Loads", False, f"Server responding but unexpected health status: {data}")
            else:
                self.log_test("Backend Server Loads", False, f"Server not responding properly: HTTP {response.status_code}")
        except requests.exceptions.RequestException as e:
            self.log_test("Backend Server Loads", False, f"Server connection failed: {str(e)}")

    def test_push_notification_accepted_rejected(self):
        """Test: postgresRequestController.js sends push notifications for accepted/rejected status changes"""
        print("\n🔍 Testing Push Notifications for Accepted/Rejected Status...")
        
        try:
            # Check the postgresRequestController.js file for push notification implementation
            with open('/app/BAGO_BACKEND/controllers/postgresRequestController.js', 'r') as f:
                content = f.read()
            
            # Check for push notification implementation in updateRequestStatus function
            has_accepted_push = (
                'sendPushNotification' in content and
                'accepted' in content and
                'Request Accepted' in content and
                'status === \'accepted\'' in content or 'statusLabel === \'accepted\'' in content
            )
            
            has_rejected_push = (
                'sendPushNotification' in content and
                'rejected' in content and
                'Request Declined' in content and
                'status === \'rejected\'' in content or 'statusLabel === \'rejected\'' in content
            )
            
            has_intransit_push = (
                'sendPushNotification' in content and
                'intransit' in content and
                'statusLabel === \'intransit\'' in content
            )
            
            has_delivering_push = (
                'sendPushNotification' in content and
                'delivering' in content and
                'statusLabel === \'delivering\'' in content
            )
            
            has_delivered_push = (
                'sendPushNotification' in content and
                'delivered' in content and
                'statusLabel === \'delivered\'' in content
            )
            
            if has_accepted_push and has_rejected_push and has_intransit_push and has_delivering_push and has_delivered_push:
                self.log_test("Push Notifications for Status Changes", True, "postgresRequestController.js sends push notifications for accepted/rejected/intransit/delivering/delivered status changes")
            else:
                missing = []
                if not has_accepted_push:
                    missing.append("accepted status")
                if not has_rejected_push:
                    missing.append("rejected status")
                if not has_intransit_push:
                    missing.append("intransit status")
                if not has_delivering_push:
                    missing.append("delivering status")
                if not has_delivered_push:
                    missing.append("delivered status")
                self.log_test("Push Notifications for Status Changes", False, f"Missing push notifications for: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Push Notifications for Status Changes", False, f"Failed to check push notification implementation: {str(e)}")

    def test_push_notification_new_messages(self):
        """Test: MessageController.js has push notification for new messages (line 264)"""
        print("\n🔍 Testing Push Notifications for New Messages...")
        
        try:
            with open('/app/BAGO_BACKEND/controllers/MessageController.js', 'r') as f:
                lines = f.readlines()
            
            # Check around line 264 for push notification implementation
            found_push_notification = False
            for i, line in enumerate(lines):
                if 'sendPushNotification' in line and ('message' in line.lower() or 'chat' in line.lower()):
                    # Check if it's in the sendMessage function or similar
                    context_lines = lines[max(0, i-10):i+5]
                    context = ''.join(context_lines)
                    if 'sendMessage' in context or 'new_message' in context:
                        found_push_notification = True
                        break
            
            if found_push_notification:
                self.log_test("Push Notifications for New Messages", True, "MessageController.js has push notification for new messages")
            else:
                self.log_test("Push Notifications for New Messages", False, "Push notification for new messages not found in MessageController.js")
                
        except Exception as e:
            self.log_test("Push Notifications for New Messages", False, f"Failed to check message push notifications: {str(e)}")

    def test_push_notification_new_requests(self):
        """Test: RequestPackage has push notification for new requests (line 115)"""
        print("\n🔍 Testing Push Notifications for New Requests...")
        
        try:
            with open('/app/BAGO_BACKEND/controllers/postgresRequestController.js', 'r') as f:
                lines = f.readlines()
            
            # Check around line 115 for push notification in RequestPackage function
            found_request_push = False
            for i, line in enumerate(lines):
                if 'sendPushNotification' in line and i >= 110 and i <= 120:
                    # Check if it's in the RequestPackage function
                    context_lines = lines[max(0, i-10):i+5]
                    context = ''.join(context_lines)
                    if 'RequestPackage' in context or 'New shipping request' in context:
                        found_request_push = True
                        break
            
            if found_request_push:
                self.log_test("Push Notifications for New Requests", True, "RequestPackage function has push notification for new requests around line 115")
            else:
                self.log_test("Push Notifications for New Requests", False, "Push notification for new requests not found in RequestPackage function")
                
        except Exception as e:
            self.log_test("Push Notifications for New Requests", False, f"Failed to check request push notifications: {str(e)}")

    def test_flutter_shell_screen_badge_count(self):
        """Test: Flutter shell_screen _NavTabIcon supports badgeCount parameter"""
        print("\n🔍 Testing Flutter Shell Screen Badge Count...")
        
        try:
            with open('/app/lib/features/shell/shell_screen.dart', 'r') as f:
                content = f.read()
            
            # Check for _NavTabIcon with badgeCount parameter
            has_badge_count_param = (
                '_NavTabIcon' in content and
                'badgeCount' in content and
                'final int badgeCount' in content
            )
            
            # Check for badge count usage in bottom navigation
            has_badge_usage = (
                'badgeCount:' in content and
                'unreadCount' in content and
                'pendingCount' in content
            )
            
            if has_badge_count_param and has_badge_usage:
                self.log_test("Flutter Shell Screen Badge Count", True, "shell_screen _NavTabIcon supports badgeCount parameter and passes badgeCount for messages and requests tabs")
            else:
                missing = []
                if not has_badge_count_param:
                    missing.append("badgeCount parameter in _NavTabIcon")
                if not has_badge_usage:
                    missing.append("badgeCount usage in navigation")
                self.log_test("Flutter Shell Screen Badge Count", False, f"Missing: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Flutter Shell Screen Badge Count", False, f"Failed to check Flutter shell screen: {str(e)}")

    def test_flutter_home_screen_activity_position(self):
        """Test: Flutter home_screen recent activity is positioned right after search hero (before services)"""
        print("\n🔍 Testing Flutter Home Screen Activity Position...")
        
        try:
            with open('/app/lib/features/home/screens/home_screen.dart', 'r') as f:
                content = f.read()
            
            # Check for activity section positioning
            # Look for the order: search hero -> activity -> services
            lines = content.split('\n')
            search_hero_line = -1
            activity_line = -1
            services_line = -1
            
            for i, line in enumerate(lines):
                if '_SenderHero' in line or '_CarrierHero' in line:
                    search_hero_line = i
                elif 'recentActivity' in line or 'tripActivityShort' in line:
                    activity_line = i
                elif 'whatDoYouWantToDo' in line or 'services' in line.lower():
                    services_line = i
            
            correct_order = (search_hero_line < activity_line < services_line and 
                           search_hero_line != -1 and activity_line != -1 and services_line != -1)
            
            if correct_order:
                self.log_test("Flutter Home Screen Activity Position", True, "home_screen recent activity is positioned right after search hero (before services)")
            else:
                self.log_test("Flutter Home Screen Activity Position", False, "Recent activity is not positioned correctly between search hero and services")
                
        except Exception as e:
            self.log_test("Flutter Home Screen Activity Position", False, f"Failed to check home screen layout: {str(e)}")

    def test_flutter_live_trip_count(self):
        """Test: Flutter home_screen _LiveTripCount replaces _LiveFeedback with real trip count"""
        print("\n🔍 Testing Flutter Live Trip Count...")
        
        try:
            with open('/app/lib/features/home/screens/home_screen.dart', 'r') as f:
                content = f.read()
            
            # Check for _LiveTripCount implementation
            has_live_trip_count = '_LiveTripCount' in content
            
            # Check that _LiveFeedback is not referenced
            has_no_live_feedback = '_LiveFeedback' not in content and 'travelersAvailableToday' not in content
            
            # Check for real trip count usage
            has_real_trip_count = (
                'tripState.searchResults.length' in content or
                'tripState.activeTrips.length' in content or
                'tripProvider' in content
            )
            
            if has_live_trip_count and has_no_live_feedback and has_real_trip_count:
                self.log_test("Flutter Live Trip Count", True, "home_screen _LiveTripCount replaces _LiveFeedback with real trip count and no longer references travelersAvailableToday")
            else:
                issues = []
                if not has_live_trip_count:
                    issues.append("_LiveTripCount not found")
                if not has_no_live_feedback:
                    issues.append("_LiveFeedback or travelersAvailableToday still referenced")
                if not has_real_trip_count:
                    issues.append("real trip count not implemented")
                self.log_test("Flutter Live Trip Count", False, f"Issues: {', '.join(issues)}")
                
        except Exception as e:
            self.log_test("Flutter Live Trip Count", False, f"Failed to check live trip count: {str(e)}")

    def test_admin_trips_view_proof_button(self):
        """Test: Admin Trips.tsx has prominent 'View Proof' button with eye icon for travel documents"""
        print("\n🔍 Testing Admin Trips View Proof Button...")
        
        try:
            with open('/app/ADMIN_NEW/src/react-app/pages/Trips.tsx', 'r') as f:
                content = f.read()
            
            # Check for View Proof button with eye icon
            has_view_proof_button = (
                'View Proof' in content and
                'eye' in content.lower() and
                'travelDocument' in content
            )
            
            # Check for "No proof uploaded" message
            has_no_proof_message = 'No proof uploaded' in content
            
            # Check for Details button
            has_details_button = 'Details' in content and 'button' in content.lower()
            
            if has_view_proof_button and has_no_proof_message and has_details_button:
                self.log_test("Admin Trips View Proof Button", True, "Trips.tsx has prominent 'View Proof' button with eye icon, 'No proof uploaded' warning, and 'Details' button")
            else:
                missing = []
                if not has_view_proof_button:
                    missing.append("View Proof button with eye icon")
                if not has_no_proof_message:
                    missing.append("No proof uploaded message")
                if not has_details_button:
                    missing.append("Details button")
                self.log_test("Admin Trips View Proof Button", False, f"Missing: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Admin Trips View Proof Button", False, f"Failed to check admin trips page: {str(e)}")

    def test_push_notification_service_availability(self):
        """Test: Push notification service is properly configured"""
        print("\n🔍 Testing Push Notification Service Availability...")
        
        try:
            with open('/app/BAGO_BACKEND/services/pushNotificationService.js', 'r') as f:
                content = f.read()
            
            # Check for proper service implementation
            has_expo_support = 'expo-server-sdk' in content and 'sendExpoPushToToken' in content
            has_fcm_support = 'firebase-admin' in content and 'sendFcmPushToToken' in content
            has_apns_support = 'sendApnsPushToToken' in content and 'http2' in content
            has_main_function = 'sendPushNotification' in content and 'sendPushNotificationToToken' in content
            
            if has_expo_support and has_fcm_support and has_apns_support and has_main_function:
                self.log_test("Push Notification Service Availability", True, "Push notification service supports Expo, FCM, and APNs with proper token handling")
            else:
                missing = []
                if not has_expo_support:
                    missing.append("Expo push support")
                if not has_fcm_support:
                    missing.append("FCM support")
                if not has_apns_support:
                    missing.append("APNs support")
                if not has_main_function:
                    missing.append("main push functions")
                self.log_test("Push Notification Service Availability", False, f"Missing: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Push Notification Service Availability", False, f"Failed to check push notification service: {str(e)}")

    def run_all_tests(self):
        """Run all push notification and feature tests"""
        print("🚀 Starting Bago Push Notification & Feature Testing Suite...")
        print(f"📍 Backend URL: {self.base_url}")
        print("=" * 70)
        
        # Backend tests
        self.test_backend_server_loads()
        self.test_push_notification_accepted_rejected()
        self.test_push_notification_new_messages()
        self.test_push_notification_new_requests()
        self.test_push_notification_service_availability()
        
        # Flutter static code review tests
        self.test_flutter_shell_screen_badge_count()
        self.test_flutter_home_screen_activity_position()
        self.test_flutter_live_trip_count()
        
        # Admin tests
        self.test_admin_trips_view_proof_button()
        
        # Print summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        print(f"✅ Tests Passed: {self.tests_passed}/{self.tests_run}")
        print(f"❌ Tests Failed: {len(self.failed_tests)}/{self.tests_run}")
        
        if self.failed_tests:
            print(f"\n❌ Failed Tests:")
            for test in self.failed_tests:
                print(f"   • {test}")
        
        if self.passed_tests:
            print(f"\n✅ Passed Tests:")
            for test in self.passed_tests:
                print(f"   • {test}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\n📈 Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test execution"""
    tester = BagoPushNotificationTester()
    success = tester.run_all_tests()
    
    # Create test report
    report = {
        "summary": f"Push notification and feature testing completed - {tester.tests_passed}/{tester.tests_run} tests passed",
        "backend_issues": tester.backend_issues,
        "frontend_issues": tester.frontend_issues,
        "passed_tests": tester.passed_tests,
        "test_report_links": ["/app/push_notification_test.py"],
        "action_item_for_main_agent": "Fix issues identified in push notification and feature testing" if (tester.backend_issues or tester.frontend_issues) else "",
        "updated_files": ["/app/push_notification_test.py"],
        "success_percentage": f"backend: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "backend: 0%",
        "should_call_test_agent_after_fix": "false",
        "should_main_agent_test_itself": "true" if not (tester.backend_issues or tester.frontend_issues) else "false"
    }
    
    # Save test report
    os.makedirs('/app/test_reports', exist_ok=True)
    report_file = '/app/test_reports/iteration_4.json'
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Test report saved to: {report_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())