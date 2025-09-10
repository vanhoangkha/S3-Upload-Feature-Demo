#!/bin/bash

echo "🔑 How to get JWT tokens for testing:"
echo ""
echo "1. Start the web app:"
echo "   cd web && npm start"
echo ""
echo "2. Open browser and go to: http://localhost:3000"
echo ""
echo "3. Login with test accounts:"
echo "   Admin:  admin / AdminPass123!"
echo "   Vendor: vendor1 / VendorPass123!"
echo ""
echo "4. Open browser dev tools (F12)"
echo "   - Go to Application tab"
echo "   - Click Local Storage"
echo "   - Find the JWT token"
echo ""
echo "5. Copy tokens and update test-all-endpoints.sh:"
echo "   ADMIN_TOKEN=\"your-admin-jwt-token\""
echo "   VENDOR_TOKEN=\"your-vendor-jwt-token\""
echo ""
echo "6. Run the test:"
echo "   ./test-all-endpoints.sh"
echo ""

# Check if web app is running
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Web app is running at http://localhost:3000"
else
    echo "❌ Web app is not running. Start it with: cd web && npm start"
fi
