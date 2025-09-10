#!/bin/bash

echo "🎭 Quick Role Testing Setup"
echo "=========================="

# Check if web app is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Web app is running on http://localhost:3000"
else
    echo "❌ Web app not running. Starting..."
    cd web && npm start &
    sleep 10
fi

echo ""
echo "🔐 Role Testing Instructions:"
echo ""
echo "1️⃣ ADMIN ROLE TEST:"
echo "   • Open: http://localhost:3000"
echo "   • Login as admin user"
echo "   • Check navigation shows all sections:"
echo "     - Core Features (3 items)"
echo "     - User Management (5 items)" 
echo "     - Administration (2 items)"
echo "     - Development (1 item)"
echo "   • Test Admin Management page"
echo "   • Test API Testing page with admin endpoints"
echo ""

echo "2️⃣ VENDOR ROLE TEST:"
echo "   • Login as vendor user"
echo "   • Check navigation shows:"
echo "     - Core Features (3 items)"
echo "     - User Management (5 items)"
echo "     - Vendor Tools (2 items)"
echo "     - Development (1 item)"
echo "   • Test Vendor Operations page"
echo "   • Verify no Admin sections visible"
echo ""

echo "3️⃣ USER ROLE TEST:"
echo "   • Login as regular user"
echo "   • Check navigation shows only:"
echo "     - Core Features (3 items)"
echo "     - User Management (5 items)"
echo "     - Development (1 item)"
echo "   • Test User Documents page"
echo "   • Verify no Admin/Vendor sections"
echo ""

echo "🧪 Test Checklist:"
echo "□ Navigation adapts to user role"
echo "□ Pages show appropriate content"
echo "□ API calls work for each role"
echo "□ Access control prevents unauthorized access"
echo "□ Error handling for forbidden actions"
echo ""

echo "🚀 Start testing at: http://localhost:3000"
