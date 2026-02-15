#!/bin/bash
# Phase 2 Production Test Script

set -e

echo "🧪 Phase 2 Production Test Suite"
echo "================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Base URL
API_BASE="http://localhost:8000"

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# Function to run a test
run_test() {
    local test_name="$1"
    local command="$2"
    
    print_status "Running: $test_name"
    
    if eval "$command" > /dev/null 2>&1; then
        print_success "$test_name"
        ((TESTS_PASSED++))
    else
        print_error "$test_name"
        ((TESTS_FAILED++))
    fi
}

# Check if API is running
print_status "Checking if API is accessible..."
if ! curl -f "$API_BASE/api/v1/shared/health" > /dev/null 2>&1; then
    print_error "API is not accessible. Please run deployment first."
    exit 1
fi

print_success "API is accessible"

# Test Health Endpoints
run_test "Shared Health Check" "curl -f $API_BASE/api/v1/shared/health"
run_test "Stateless Health Check" "curl -f $API_BASE/api/v1/stateless/health"
run_test "Stateful Health Check" "curl -f $API_BASE/api/v1/stateful/health"

# Test Info Endpoints
run_test "Application Info" "curl -f $API_BASE/api/v1/shared/info"
run_test "Stateless Info" "curl -f $API_BASE/api/v1/stateless/info"

# Test Stateless API
run_test "Calculation (Add)" "curl -f -X POST $API_BASE/api/v1/stateless/calculate -H 'Content-Type: application/json' -d '{\"operation\":\"add\",\"operand1\":5,\"operand2\":3}'"
run_test "Calculation (Multiply)" "curl -f -X POST $API_BASE/api/v1/stateless/calculate -H 'Content-Type: application/json' -d '{\"operation\":\"multiply\",\"operand1\":4,\"operand2\":6}'"
run_test "Random Numbers" "curl -f '$API_BASE/api/v1/stateless/random?type=number&count=3&min_value=1&max_value=10'"
run_test "Random Strings" "curl -f '$API_BASE/api/v1/stateless/random?type=string&count=2'"

# Test Stateful API
SESSION_ID=$(curl -s -X POST "$API_BASE/api/v1/stateful/sessions?user_id=1" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)

if [ -n "$SESSION_ID" ]; then
    print_success "Session created: $SESSION_ID"
    
    run_test "Get Session" "curl -f $API_BASE/api/v1/stateful/sessions/$SESSION_ID"
    run_test "Update Session" "curl -f -X PUT $API_BASE/api/v1/stateful/sessions/$SESSION_ID -H 'Content-Type: application/json' -d '{\"session_data\":{\"test\":\"value\"}}'"
    run_test "Add to Cart" "curl -f -X POST $API_BASE/api/v1/stateful/cart/$SESSION_ID?product_id=1&quantity=2"
    run_test "Get Cart" "curl -f $API_BASE/api/v1/stateful/cart/$SESSION_ID"
    run_test "Delete Session" "curl -f -X DELETE $API_BASE/api/v1/stateful/sessions/$SESSION_ID"
else
    print_error "Failed to create session"
    ((TESTS_FAILED++))
fi

# Test Shared API
run_test "Metrics Endpoint" "curl -f $API_BASE/api/v1/shared/metrics"

# Test Database Operations
run_test "Get Users" "curl -f '$API_BASE/api/v1/stateless/users?limit=5'"
run_test "Get Products" "curl -f '$API_BASE/api/v1/stateless/products?limit=5'"
run_test "Get Products by Category" "curl -f '$API_BASE/api/v1/stateless/products?category=Electronics&limit=3'"

# Test API Documentation
run_test "Swagger Docs" "curl -f $API_BASE/docs"
run_test "ReDoc" "curl -f $API_BASE/redoc"

# Print test results
echo ""
echo "📊 Test Results:"
echo "================"
echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
echo -e "${RED}Failed: $TESTS_FAILED${NC}"
echo -e "${BLUE}Total: $((TESTS_PASSED + TESTS_FAILED))${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    print_success "All tests passed! 🎉"
    echo ""
    echo "🌐 API is fully functional and ready for use!"
    exit 0
else
    print_error "Some tests failed. Please check the deployment."
    exit 1
fi
