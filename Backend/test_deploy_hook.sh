#!/bin/bash

# Test script for Render Deploy Hook
# Usage: ./test_deploy_hook.sh YOUR_DEPLOY_HOOK_URL

if [ -z "$1" ]; then
    echo "Usage: $0 <RENDER_DEPLOY_HOOK_URL>"
    echo "Example: $0 https://api.render.com/deploy/srv-xxxxx?key=xxxxx"
    exit 1
fi

DEPLOY_HOOK_URL="$1"

echo "🚀 Testing Render deployment trigger..."
echo "URL: ${DEPLOY_HOOK_URL:0:50}..."

response=$(curl -s -w "%{http_code}" -X POST "$DEPLOY_HOOK_URL")
http_code="${response: -3}"

if [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
    echo "✅ Deployment triggered successfully! (HTTP $http_code)"
    echo "🔗 Check deployment status at: https://dashboard.render.com/"
else
    echo "❌ Deployment trigger failed (HTTP $http_code)"
    echo "Response: ${response%???}"
    exit 1
fi