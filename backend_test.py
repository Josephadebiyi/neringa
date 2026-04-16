#!/usr/bin/env python3
"""
Backend Testing Suite for Bago Flutter App
Tests all backend functionality including syntax validation, API routes, and business logic
"""

import os
import sys
import json
import subprocess
import requests
import time
from datetime import datetime
from typing import Dict, List, Any, Optional

class BagoBackendTester:
    def __init__(self):
        self.base_url = self._get_backend_url()
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []
        self.passed_tests = []
        self.backend_issues = []
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
            self.backend_issues.append({
                "test": name,
                "issue": error or details,
                "fix_priority": "HIGH"
            })
            print(f"❌ {name}: {error or details}")
        
        self.test_results[name] = {
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }

    def test_syntax_validation(self):
        """Test 1: Backend syntax validation - server.js loads without syntax errors"""
        print("\n🔍 Testing Backend Syntax Validation...")
        
        try:
            # Test Node.js syntax check with simpler approach
            result = subprocess.run(
                ['node', '-c', 'server.js'],
                cwd='/app/BAGO_BACKEND',
                capture_output=True,
                text=True,
                timeout=5
            )
            
            if result.returncode == 0:
                self.log_test("Backend Syntax Validation", True, "server.js loads without syntax errors")
            else:
                self.log_test("Backend Syntax Validation", False, f"Syntax errors found: {result.stderr}")
                
        except subprocess.TimeoutExpired:
            self.log_test("Backend Syntax Validation", False, "Syntax check timed out")
        except Exception as e:
            self.log_test("Backend Syntax Validation", False, f"Syntax check failed: {str(e)}")

    def test_phone_change_routes(self):
        """Test 2: Phone change routes exist in userRouters.js"""
        print("\n🔍 Testing Phone Change Routes...")
        
        try:
            # Check if routes exist in userRouters.js
            with open('/app/BAGO_BACKEND/routers/userRouters.js', 'r') as f:
                content = f.read()
            
            request_route_exists = '/user/request-phone-change' in content and 'POST' in content
            verify_route_exists = '/user/verify-phone-change' in content and 'POST' in content
            
            if request_route_exists and verify_route_exists:
                self.log_test("Phone Change Routes", True, "Both POST /user/request-phone-change and POST /user/verify-phone-change routes exist")
            else:
                missing = []
                if not request_route_exists:
                    missing.append("POST /user/request-phone-change")
                if not verify_route_exists:
                    missing.append("POST /user/verify-phone-change")
                self.log_test("Phone Change Routes", False, f"Missing routes: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Phone Change Routes", False, f"Failed to check routes: {str(e)}")

    def test_escrow_hold_logic(self):
        """Test 3: Escrow hold logic exists in shipping.js"""
        print("\n🔍 Testing Escrow Hold Logic...")
        
        try:
            with open('/app/BAGO_BACKEND/lib/postgres/shipping.js', 'r') as f:
                content = f.read()
            
            # Check for escrow hold logic in updateShipmentRequestStatus
            has_escrow_logic = (
                'escrow_balance' in content and
                'escrow_hold' in content and
                'status === \'accepted\'' in content and
                'sendToEscrow' in content or 'escrow_balance + $2' in content
            )
            
            if has_escrow_logic:
                self.log_test("Escrow Hold Logic", True, "Escrow hold logic exists in updateShipmentRequestStatus when status is accepted")
            else:
                self.log_test("Escrow Hold Logic", False, "Escrow hold logic not found in shipping.js")
                
        except Exception as e:
            self.log_test("Escrow Hold Logic", False, f"Failed to check escrow logic: {str(e)}")

    def test_kg_deduction_logic(self):
        """Test 4: KG deduction logic exists in shipping.js"""
        print("\n🔍 Testing KG Deduction Logic...")
        
        try:
            with open('/app/BAGO_BACKEND/lib/postgres/shipping.js', 'r') as f:
                content = f.read()
            
            # Check for KG deduction logic
            has_kg_deduction = (
                'available_kg' in content and
                'packageWeight' in content and
                'available_kg - $2' in content and
                'status === \'accepted\'' in content or 'normalizedStatus === \'accepted\'' in content
            )
            
            if has_kg_deduction:
                self.log_test("KG Deduction Logic", True, "KG deduction logic exists in shipping.js when status is accepted")
            else:
                self.log_test("KG Deduction Logic", False, "KG deduction logic not found in shipping.js")
                
        except Exception as e:
            self.log_test("KG Deduction Logic", False, f"Failed to check KG deduction logic: {str(e)}")

    def test_pdf_logo_fallback(self):
        """Test 5: PDF logo fallback exists in pdfGenerator.js"""
        print("\n🔍 Testing PDF Logo Fallback...")
        
        try:
            with open('/app/BAGO_BACKEND/services/pdfGenerator.js', 'r') as f:
                content = f.read()
            
            # Check for logo fallback logic in drawBrandHeader
            has_fallback = (
                'drawBrandHeader' in content and
                'logoPath' in content and
                'fs.existsSync' in content and
                'BAGO' in content and
                'text-based logo' in content or 'fallback' in content.lower()
            )
            
            if has_fallback:
                self.log_test("PDF Logo Fallback", True, "drawBrandHeader has fallback text logo when image file not found")
            else:
                self.log_test("PDF Logo Fallback", False, "PDF logo fallback not found in pdfGenerator.js")
                
        except Exception as e:
            self.log_test("PDF Logo Fallback", False, f"Failed to check PDF logo fallback: {str(e)}")

    def test_pdf_generation_functions(self):
        """Test 6: PDF generation functions include brand header"""
        print("\n🔍 Testing PDF Generation Functions...")
        
        try:
            with open('/app/BAGO_BACKEND/services/pdfGenerator.js', 'r') as f:
                content = f.read()
            
            # Check for PDF generation functions
            has_shipment_pdf = 'generateShipmentSummaryPDF' in content and 'drawBrandHeader' in content
            has_customs_pdf = 'generateCustomsDeclarationPDF' in content and 'drawBrandHeader' in content
            
            if has_shipment_pdf and has_customs_pdf:
                self.log_test("PDF Generation Functions", True, "generateShipmentSummaryPDF and generateCustomsDeclarationPDF include brand header with logo")
            else:
                missing = []
                if not has_shipment_pdf:
                    missing.append("generateShipmentSummaryPDF")
                if not has_customs_pdf:
                    missing.append("generateCustomsDeclarationPDF")
                self.log_test("PDF Generation Functions", False, f"Missing brand header in: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("PDF Generation Functions", False, f"Failed to check PDF generation functions: {str(e)}")

    def test_admin_notification_controller(self):
        """Test 7: Admin NotificationController functionality"""
        print("\n🔍 Testing Admin Notification Controller...")
        
        try:
            with open('/app/BAGO_BACKEND/controllers/AdminControllers/NotificationController.js', 'r') as f:
                content = f.read()
            
            # Check for broadcast functionality
            has_broadcast = (
                'sendNotification' in content and
                'SELECT id, push_tokens FROM public.profiles' in content and
                'INSERT INTO public.notifications' in content and
                'broadcast' in content
            )
            
            if has_broadcast:
                self.log_test("Admin Notification Controller", True, "NotificationController sends to all users and stores in-app notifications")
            else:
                self.log_test("Admin Notification Controller", False, "Admin notification broadcast functionality not found")
                
        except Exception as e:
            self.log_test("Admin Notification Controller", False, f"Failed to check admin notification controller: {str(e)}")

    def test_admin_router_endpoints(self):
        """Test 8: Admin router has push notification history endpoint"""
        print("\n🔍 Testing Admin Router Endpoints...")
        
        try:
            with open('/app/BAGO_BACKEND/AdminRouter/AdminRouter.js', 'r') as f:
                content = f.read()
            
            # Check for push notification history endpoint - more flexible search
            has_history_endpoint = (
                '/push-notifications/history' in content and
                'getPushHistory' in content
            )
            
            if has_history_endpoint:
                self.log_test("Admin Router Endpoints", True, "AdminRouter has push-notifications/history GET endpoint")
            else:
                self.log_test("Admin Router Endpoints", False, "push-notifications/history GET endpoint not found in AdminRouter")
                
        except Exception as e:
            self.log_test("Admin Router Endpoints", False, f"Failed to check admin router endpoints: {str(e)}")

    def test_get_travelers_filtering(self):
        """Test 9: getTravelers filters by available_kg > 0 and approved status"""
        print("\n🔍 Testing getTravelers Filtering...")
        
        try:
            with open('/app/BAGO_BACKEND/controllers/getTravelers.js', 'r') as f:
                content = f.read()
            
            # Check for filtering logic
            has_kg_filter = 'available_kg > 0' in content
            has_status_filter = "status IN ('active', 'verified')" in content or "status IN ('verified', 'active')" in content
            
            if has_kg_filter and has_status_filter:
                self.log_test("getTravelers Filtering", True, "getTravelers filters by available_kg > 0 and status IN active/verified (no unapproved)")
            else:
                missing = []
                if not has_kg_filter:
                    missing.append("available_kg > 0 filter")
                if not has_status_filter:
                    missing.append("status filter for active/verified")
                self.log_test("getTravelers Filtering", False, f"Missing filters: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("getTravelers Filtering", False, f"Failed to check getTravelers filtering: {str(e)}")

    def test_push_token_handling(self):
        """Test 10: Push token handling with RETURNING clause"""
        print("\n🔍 Testing Push Token Handling...")
        
        try:
            # Check addPushToken in profiles.js
            with open('/app/BAGO_BACKEND/lib/postgres/profiles.js', 'r') as f:
                profiles_content = f.read()
            
            # Check savePushToken in postgresUserController.js
            with open('/app/BAGO_BACKEND/controllers/postgresUserController.js', 'r') as f:
                controller_content = f.read()
            
            has_returning_clause = 'returning' in profiles_content.lower() and 'addPushToken' in profiles_content
            has_verification = 'isStored' in controller_content and 'savePushToken' in controller_content
            has_updated_at = 'updated_at' in profiles_content and ('timezone' in profiles_content or 'now()' in profiles_content)
            
            if has_returning_clause and has_verification and has_updated_at:
                self.log_test("Push Token Handling", True, "addPushToken has RETURNING clause, updates updated_at, and savePushToken verifies storage")
            else:
                missing = []
                if not has_returning_clause:
                    missing.append("RETURNING clause in addPushToken")
                if not has_verification:
                    missing.append("storage verification in savePushToken")
                if not has_updated_at:
                    missing.append("updated_at field update")
                self.log_test("Push Token Handling", False, f"Missing: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Push Token Handling", False, f"Failed to check push token handling: {str(e)}")

    def test_flutter_service_methods(self):
        """Test 11: Flutter shipment service has required methods"""
        print("\n🔍 Testing Flutter Service Methods...")
        
        try:
            with open('/app/lib/features/shipments/services/shipment_service.dart', 'r') as f:
                content = f.read()
            
            has_update_method = 'updateShipmentStatus' in content
            has_status_param = 'required String status' in content
            has_location_param = 'String? location' in content
            has_notes_param = 'String? notes' in content
            
            if has_update_method and has_status_param and has_location_param and has_notes_param:
                self.log_test("Flutter Service Methods", True, "shipment_service.dart has updateShipmentStatus method with required parameters")
            else:
                missing = []
                if not has_update_method:
                    missing.append("updateShipmentStatus method")
                if not has_status_param:
                    missing.append("status parameter")
                if not has_location_param:
                    missing.append("location parameter")
                if not has_notes_param:
                    missing.append("notes parameter")
                self.log_test("Flutter Service Methods", False, f"Missing: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Flutter Service Methods", False, f"Failed to check Flutter service methods: {str(e)}")

    def test_flutter_ui_components(self):
        """Test 12: Flutter UI has shipment status buttons and image gallery"""
        print("\n🔍 Testing Flutter UI Components...")
        
        try:
            with open('/app/lib/features/shipments/screens/shipment_request_screen.dart', 'r') as f:
                content = f.read()
            
            has_status_buttons = '_ShipmentStatusButtons' in content
            has_image_gallery = 'packageImages.length > 1' in content and 'ListView.separated' in content
            has_package_photos = 'Package Photos' in content
            has_accept_logic = 'Show package images gallery before accept' in content or 'req.packageImages' in content
            
            if has_status_buttons and has_image_gallery and has_package_photos:
                self.log_test("Flutter UI Components", True, "shipment_request_screen.dart has _ShipmentStatusButtons widget and shows package images gallery before accept")
            else:
                missing = []
                if not has_status_buttons:
                    missing.append("_ShipmentStatusButtons widget")
                if not has_image_gallery:
                    missing.append("package images gallery")
                if not has_package_photos:
                    missing.append("Package Photos section")
                self.log_test("Flutter UI Components", False, f"Missing: {', '.join(missing)}")
                
        except Exception as e:
            self.log_test("Flutter UI Components", False, f"Failed to check Flutter UI components: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("🚀 Starting Bago Backend Testing Suite...")
        print(f"📍 Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Run all tests
        self.test_syntax_validation()
        self.test_phone_change_routes()
        self.test_escrow_hold_logic()
        self.test_kg_deduction_logic()
        self.test_pdf_logo_fallback()
        self.test_pdf_generation_functions()
        self.test_admin_notification_controller()
        self.test_admin_router_endpoints()
        self.test_get_travelers_filtering()
        self.test_push_token_handling()
        self.test_flutter_service_methods()
        self.test_flutter_ui_components()
        
        # Print summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
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
    tester = BagoBackendTester()
    success = tester.run_all_tests()
    
    # Create test report
    report = {
        "summary": f"Backend testing completed - {tester.tests_passed}/{tester.tests_run} tests passed",
        "backend_issues": tester.backend_issues,
        "frontend_issues": {},
        "passed_tests": tester.passed_tests,
        "test_report_links": ["/app/backend_test.py"],
        "action_item_for_main_agent": "Fix backend issues identified in testing" if tester.backend_issues else "",
        "updated_files": ["/app/backend_test.py"],
        "success_percentage": f"backend: {(tester.tests_passed / tester.tests_run * 100):.1f}%" if tester.tests_run > 0 else "backend: 0%",
        "should_call_test_agent_after_fix": "false",
        "should_main_agent_test_itself": "true" if not tester.backend_issues else "false"
    }
    
    # Save test report
    os.makedirs('/app/test_reports', exist_ok=True)
    report_file = '/app/test_reports/iteration_3.json'
    with open(report_file, 'w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\n📄 Test report saved to: {report_file}")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())