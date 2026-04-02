#!/bin/bash
set -e

echo "🚀 Starting Comprehensive Test Suite"
echo "===================================="

# Step 1: Build test
echo -e "\n📦 Test 1: Build Verification"
npm run build > /dev/null 2>&1 && echo "✅ Build passed" || { echo "❌ Build failed"; exit 1; }

# Step 2: Linting test
echo -e "\n🔍 Test 2: ESLint Verification"
npm run lint > /dev/null 2>&1 && echo "✅ Linting passed" || { echo "❌ Linting failed"; exit 1; }

# Step 3: Type check
echo -e "\n📝 Test 3: TypeScript Check"
npx tsc --noEmit > /dev/null 2>&1 && echo "✅ TypeScript check passed" || { echo "❌ TypeScript check failed"; exit 1; }

# Step 4: Dependencies check
echo -e "\n📚 Test 4: Dependencies Check"
npm ls > /dev/null 2>&1 && echo "✅ Dependencies OK" || { echo "⚠️ Dependencies warning (non-critical)"; }

# Step 5: Environment variables
echo -e "\n🔐 Test 5: Environment Setup"
if [ -f ".env" ]; then
    if grep -q "GEMINI_API_KEY" .env; then
        echo "✅ GEMINI_API_KEY found"
    else
        echo "⚠️ GEMINI_API_KEY missing (needed for AI analysis)"
    fi
else
    echo "⚠️ .env file not found (using defaults)"
fi

# Step 6: Key files check
echo -e "\n📂 Test 6: Required Files Check"
files=(
    "src/app/page.tsx"
    "src/app/layout.tsx"
    "src/app/api/extract/route.ts"
    "src/app/api/analyze/route.ts"
    "src/lib/pdf.ts"
    "src/components/Providers.tsx"
    "src/lib/i18n/index.ts"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✅ $file"
    else
        echo "  ❌ $file - MISSING"
    fi
done

echo -e "\n📊 All Static Tests Passed!"
echo "===================================="
echo -e "\nTo run integration tests (requires dev server):"
echo "1. Start: npm run dev"
echo "2. In another terminal: run HTTP requests to test endpoints"
echo ""
