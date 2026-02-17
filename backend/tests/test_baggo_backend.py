"""
Backend API Tests for Baggo Mobile App
Testing: Payment Gateway Detection, Route Search, Pricing Calculation
"""
import pytest
import requests
import os

# Backend URL - using localhost as specified in the request
BASE_URL = "http://localhost:5000"


class TestHealthCheck:
    """Health check endpoint tests"""
    
    def test_health_endpoint_returns_200(self):
        """Test /health endpoint returns OK status"""
        response = requests.get(f"{BASE_URL}/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data
        print(f"✅ Health check passed: {data}")


class TestPaymentGatewayDetection:
    """Payment gateway detection based on country code tests"""
    
    def test_ng_returns_paystack(self):
        """Nigeria should return paystack"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/NG")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["paymentGateway"] == "paystack"
        assert data["isAfricanCountry"] is True
        assert data["countryCode"] == "NG"
        assert data["currency"]["currency"] == "NGN"
        print(f"✅ Nigeria: paystack - {data['currency']}")
    
    def test_gh_returns_paystack(self):
        """Ghana should return paystack"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/GH")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["paymentGateway"] == "paystack"
        assert data["isAfricanCountry"] is True
        assert data["currency"]["currency"] == "GHS"
        print(f"✅ Ghana: paystack - {data['currency']}")
    
    def test_ke_returns_paystack(self):
        """Kenya should return paystack"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/KE")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["paymentGateway"] == "paystack"
        assert data["isAfricanCountry"] is True
        assert data["currency"]["currency"] == "KES"
        print(f"✅ Kenya: paystack - {data['currency']}")
    
    def test_za_returns_paystack(self):
        """South Africa should return paystack"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/ZA")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["paymentGateway"] == "paystack"
        assert data["isAfricanCountry"] is True
        assert data["currency"]["currency"] == "ZAR"
        print(f"✅ South Africa: paystack - {data['currency']}")
    
    def test_gb_returns_stripe(self):
        """Great Britain should return stripe"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/GB")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["paymentGateway"] == "stripe"
        assert data["isAfricanCountry"] is False
        assert data["currency"]["currency"] == "GBP"
        print(f"✅ Great Britain: stripe - {data['currency']}")
    
    def test_us_returns_stripe(self):
        """United States should return stripe"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/US")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["paymentGateway"] == "stripe"
        assert data["isAfricanCountry"] is False
        assert data["currency"]["currency"] == "USD"
        print(f"✅ United States: stripe - {data['currency']}")
    
    def test_lowercase_country_code(self):
        """Test lowercase country codes are handled"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/ng")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        # Should still return paystack for ng
        assert data["paymentGateway"] == "paystack"
        print(f"✅ Lowercase 'ng' handled correctly")
    
    def test_unknown_country_returns_stripe(self):
        """Unknown countries should fallback to stripe"""
        response = requests.get(f"{BASE_URL}/api/payment/gateway/XX")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert data["paymentGateway"] == "stripe"
        assert data["isAfricanCountry"] is False
        print(f"✅ Unknown country XX: stripe (fallback)")


class TestRouteSearch:
    """Route search endpoint tests"""
    
    def test_search_without_params_returns_error(self):
        """Search without parameters should return error"""
        response = requests.get(f"{BASE_URL}/api/routes/search")
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "at least one search parameter" in data["message"]
        print(f"✅ Empty search correctly rejected")
    
    def test_search_by_from_city(self):
        """Search by origin city should work (returns empty if no routes)"""
        response = requests.get(f"{BASE_URL}/api/routes/search?from=Lagos")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "routes" in data
        assert isinstance(data["routes"], list)
        print(f"✅ Search by from=Lagos returned {len(data['routes'])} routes")
    
    def test_search_by_to_city(self):
        """Search by destination city should work"""
        response = requests.get(f"{BASE_URL}/api/routes/search?to=London")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "routes" in data
        assert isinstance(data["routes"], list)
        print(f"✅ Search by to=London returned {len(data['routes'])} routes")
    
    def test_search_by_from_country(self):
        """Search by origin country code should work"""
        response = requests.get(f"{BASE_URL}/api/routes/search?fromCountry=NG")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "routes" in data
        print(f"✅ Search by fromCountry=NG returned {len(data['routes'])} routes")
    
    def test_search_by_to_country(self):
        """Search by destination country code should work"""
        response = requests.get(f"{BASE_URL}/api/routes/search?toCountry=GB")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "routes" in data
        print(f"✅ Search by toCountry=GB returned {len(data['routes'])} routes")
    
    def test_search_with_multiple_params(self):
        """Search with multiple parameters should work"""
        response = requests.get(f"{BASE_URL}/api/routes/search?from=Lagos&toCountry=GB")
        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "routes" in data
        print(f"✅ Multi-param search returned {len(data['routes'])} routes")


class TestCalculatePrice:
    """Price calculation endpoint tests"""
    
    def test_calculate_price_missing_params(self):
        """Calculate price without params should return error"""
        response = requests.post(
            f"{BASE_URL}/api/routes/calculate-price",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "routeId and weightKg are required" in data["message"]
        print(f"✅ Missing params correctly rejected")
    
    def test_calculate_price_invalid_route_id(self):
        """Calculate price with invalid routeId should return error"""
        response = requests.post(
            f"{BASE_URL}/api/routes/calculate-price",
            json={"routeId": "invalid_id", "weightKg": 5},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 500
        data = response.json()
        assert data["success"] is False
        # Should fail due to invalid ObjectId
        print(f"✅ Invalid routeId correctly rejected")
    
    def test_calculate_price_nonexistent_route(self):
        """Calculate price with valid but nonexistent routeId should return 404"""
        # Using a valid ObjectId format but nonexistent
        response = requests.post(
            f"{BASE_URL}/api/routes/calculate-price",
            json={"routeId": "507f1f77bcf86cd799439011", "weightKg": 5},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert "Route not found" in data["message"]
        print(f"✅ Nonexistent route correctly returns 404")


class TestTripPricing:
    """Trip pricing endpoint tests"""
    
    def test_trip_pricing_missing_params(self):
        """Trip pricing without required params should return error"""
        response = requests.post(
            f"{BASE_URL}/api/routes/trip-pricing",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        assert "fromCity, fromCountryCode, toCity, and toCountryCode are required" in data["message"]
        print(f"✅ Missing trip pricing params correctly rejected")
    
    def test_trip_pricing_route_not_found(self):
        """Trip pricing for nonexistent route should return appropriate message"""
        response = requests.post(
            f"{BASE_URL}/api/routes/trip-pricing",
            json={
                "fromCity": "Lagos",
                "fromCountryCode": "NG",
                "toCity": "London",
                "toCountryCode": "GB",
                "weightKg": 5
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 404
        data = response.json()
        assert data["success"] is False
        assert data["routeNotFound"] is True
        assert "No pricing available for this route" in data["message"]
        print(f"✅ Route not found returns correct message")
    
    def test_trip_pricing_partial_params(self):
        """Trip pricing with partial params should return error"""
        response = requests.post(
            f"{BASE_URL}/api/routes/trip-pricing",
            json={
                "fromCity": "Lagos",
                "fromCountryCode": "NG"
                # Missing toCity and toCountryCode
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 400
        data = response.json()
        assert data["success"] is False
        print(f"✅ Partial params correctly rejected")


class TestRootAndMiscEndpoints:
    """Test root and miscellaneous endpoints"""
    
    def test_root_endpoint(self):
        """Test root endpoint returns hello"""
        response = requests.get(f"{BASE_URL}/")
        assert response.status_code == 200
        assert response.text == "hello"
        print(f"✅ Root endpoint returns hello")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
