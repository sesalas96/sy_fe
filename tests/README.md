# Playwright E2E Testing Setup

This directory contains end-to-end tests for the Safety Management System using Playwright.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Basic Commands

```bash
# Run all tests
npm run test:e2e

# Run tests with UI mode (interactive)
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Run tests in debug mode
npm run test:e2e:debug

# Show test reports
npm run test:e2e:report
```

### Running Specific Tests

```bash
# Run only authentication tests
npx playwright test auth

# Run only registration tests
npx playwright test registration-flow

# Run only login tests  
npx playwright test login-flow

# Run tests on specific browser
npx playwright test --project=chromium

# Run tests on mobile
npx playwright test --project="Mobile Chrome"
```

## Test Structure

### Test Files

- `auth.spec.ts` - Complete authentication flow tests
- `registration-flow.spec.ts` - Registration specific tests
- `login-flow.spec.ts` - Login specific tests

### Helper Files

- `helpers/auth-helpers.ts` - Reusable authentication helper functions

### Test Categories

#### Registration Tests
- ✅ Mock data pre-filling
- ✅ Step navigation (1-4)
- ✅ Form validation
- ✅ Email format validation
- ✅ Invitation code validation (6 characters)
- ✅ Password requirements
- ✅ Terms and conditions requirement
- ✅ Cedula formatting
- ✅ Progress bar percentages
- ✅ Mobile responsiveness
- ✅ Success flow to login

#### Login Tests
- ✅ Form display and validation
- ✅ Quick access menu functionality
- ✅ Auto-fill from quick access
- ✅ Invalid credentials handling
- ✅ Password visibility toggle
- ✅ Navigation to registration
- ✅ Success message from registration
- ✅ Mobile responsiveness
- ✅ Multiple user types
- ✅ Form submission (Enter key)

### Key Features Tested

1. **Registration Flow**
   - Complete 4-step registration process
   - Form validation at each step
   - Mock data pre-filling
   - Step navigation (forward/backward)
   - Progress tracking
   - Success redirect to login

2. **Login Flow**
   - Quick access users (demo mode)
   - Form validation
   - Error handling
   - Password visibility
   - Success redirect to dashboard

3. **Cross-Flow Integration**
   - Registration → Login with pre-filled email
   - Success messages between pages
   - State preservation

4. **Responsive Design**
   - Mobile viewport testing
   - Desktop layout verification
   - Touch interactions

## Configuration

Tests are configured in `playwright.config.ts`:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Auto-start**: Development server before tests
- **Trace**: Enabled on retry for debugging
- **Reports**: HTML report generated

## Best Practices

1. **Page Object Pattern**: Use helper classes for common operations
2. **Test Isolation**: Each test runs independently
3. **Realistic Data**: Generate unique test data to avoid conflicts
4. **Assertions**: Use meaningful assertions with good error messages
5. **Waiting**: Use Playwright's built-in waiting mechanisms
6. **Cleanup**: Tests clean up after themselves

## Debugging

### UI Mode
```bash
npm run test:e2e:ui
```
Interactive test runner with timeline, DOM snapshots, and network logs.

### Debug Mode
```bash
npm run test:e2e:debug
```
Runs tests with Playwright Inspector for step-by-step debugging.

### Headed Mode
```bash
npm run test:e2e:headed
```
Shows browser window during test execution.

### Screenshots and Videos
- Screenshots captured on failure
- Videos recorded in CI environment
- Traces available for failed test analysis

## CI/CD Integration

Tests are configured to run in CI environments:
- Retry failed tests 2 times
- Run in headless mode
- Generate HTML reports
- Parallel execution disabled in CI

## Adding New Tests

1. Create test file in `tests/` directory
2. Import necessary helpers
3. Follow existing naming conventions
4. Add appropriate test descriptions
5. Use helper functions for common operations
6. Ensure tests are independent and can run in parallel

Example test structure:
```typescript
import { test, expect } from '@playwright/test';
import { AuthHelpers } from './helpers/auth-helpers';

test.describe('Feature Tests', () => {
  let authHelpers: AuthHelpers;

  test.beforeEach(async ({ page }) => {
    authHelpers = new AuthHelpers(page);
  });

  test('should test feature behavior', async ({ page }) => {
    // Test implementation
  });
});
```