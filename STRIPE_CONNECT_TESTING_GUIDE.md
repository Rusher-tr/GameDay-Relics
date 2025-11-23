# Stripe Connect - Testing Guide

## What Was Wrong

1. **Redirect URL Typo** - After Stripe verification, app tried to redirect to `/seller/stripe-connect` (doesn't exist)
2. **No Callback Handler** - Frontend didn't check for success/refresh parameters on return
3. **Missing Object Init** - `paymentDetails` wasn't being initialized, causing ID storage to fail
4. **No Debug Info** - Impossible to troubleshoot without logs

## What Was Fixed

✅ Redirect URLs now point to `/payment-settings` (correct route)
✅ Frontend detects `?success=true` and `?refresh=true` parameters
✅ Backend initializes `paymentDetails` before accessing
✅ Added console logging for debugging

---

## How to Test

### Prerequisite
- Make sure you have Stripe test keys configured
- Backend running: `npm run dev` (port 8000)
- Frontend running: `npm run dev` (port 5173)

### Test 1: Basic Connection Flow

```bash
1. Navigate to /payment-settings as a seller account
2. Click "Connect Stripe Account" button
3. Verify:
   - ✓ Blue button shows loading state
   - ✓ Browser URL changes to Stripe domain (https://connect.stripe.com/...)
   - ✓ URL contains your app URL (not /seller/stripe-connect)
```

### Test 2: Stripe Onboarding

```bash
1. Complete Stripe's test onboarding:
   - Enter any test name (e.g., "Test Seller")
   - For country: Select Pakistan (PK)
   - For date of birth: Any valid date
   - For address: Use any test address
   - For bank details: Use test bank info
   - Click "Continue"

2. Verify:
   - ✓ Redirects back to your app
   - ✓ URL shows /payment-settings?success=true
   - ✓ Success toast appears: "✅ Stripe onboarding completed!"
```

### Test 3: Status Auto-Update

```bash
1. After successful redirect:
2. Verify within 2 seconds:
   - ✓ Status changes from "Not Connected" to "Connected ✓"
   - ✓ Green checkmark appears
   - ✓ Account ID displays (starts with acct_)
   - ✓ "Connect" button disappears
   - ✓ "Disconnect" button appears
```

### Test 4: Refresh Button

```bash
1. Click "Refresh Status" button
2. Verify:
   - ✓ Blue button shows loading state
   - ✓ Info toast: "Status refreshed"
   - ✓ Status stays "Connected ✓"
   - ✓ No errors in console
```

### Test 5: Disconnect Function

```bash
1. While connected, click "Disconnect" button
2. Verify:
   - ✓ Confirmation modal appears
   - ✓ Click "Yes" to confirm
   - ✓ Status changes back to "Not Connected"
   - ✓ "Connect" button reappears
   - ✓ Success toast: "Stripe account disconnected successfully"
```

### Test 6: Multiple Sellers

```bash
1. Create 2 seller accounts
2. For Seller 1:
   - Connect Stripe → Should show "Connected"
3. For Seller 2:
   - Don't connect → Should show "Not Connected"
4. Switch back to Seller 1:
   - Should still show "Connected"
5. Verify:
   - ✓ Each seller has independent status
   - ✓ No data leakage between sellers
```

---

## Console Debugging

### Check Backend Logs

Open terminal running backend (`npm run dev` in GameDay-Relics folder).

Look for these patterns:

```
[Stripe Connect] Created new account acct_... for seller ...
  ✓ Means account was created successfully

[Stripe Connect] Generated onboarding link for seller ...
  ✓ Means onboarding link was created

[Stripe Status] Account acct_... status: completed, charges_enabled: true
  ✓ Means account is verified

[Stripe Status] Account acct_... status: pending, charges_enabled: false
  ✓ Means account is still verifying

[Stripe Disconnect] Disconnected account acct_... for seller ...
  ✓ Means disconnect was successful
```

### Check Frontend Console

Open browser DevTools (F12 → Console tab).

You should see:

```
Network tab:
- POST /api/v1/payment/connect/create-link → 200 OK
- GET /api/v1/payment/connect/status → 200 OK
- POST /api/v1/payment/connect/disconnect → 200 OK

Console messages:
- [Payment Settings] Connect error: (none = success)
- [Payment Settings] Error checking status: (none = success)
```

### Common Issues & Fixes

| Issue | Console Shows | Fix |
|-------|---------------|-----|
| Stripe not loading | 404 on connect-link | Check backend routes |
| Account not saving | stripeConnectedAccountId is null | Check DB paymentDetails |
| Wrong redirect | URL is `/seller/stripe-connect` | Restart backend server |
| Status not updating | Still shows "Not Connected" | Try manual refresh, check Stripe account status in dashboard |
| Disconnect fails | 403 Forbidden | Make sure STRIPE_CLIENT_ID is set |

---

## Network Tab Testing

### Open Browser DevTools (F12)

Go to Network tab, then test each flow:

#### Connect Flow
```
1. Click "Connect Stripe Account"
   POST /api/v1/payment/connect/create-link
   Status: 200
   Response Body: { data: { url: "https://connect.stripe.com/..." } }

2. After Stripe redirects back
   GET /api/v1/payment/connect/status
   Status: 200
   Response Body: { data: { status: "pending" or "completed", accountId: "acct_...", ... } }
```

#### Check Status Flow
```
1. Click "Refresh Status"
   GET /api/v1/payment/connect/status
   Status: 200
   Response Body: { data: { status: "completed", accountId: "acct_...", chargesEnabled: true, ... } }
```

#### Disconnect Flow
```
1. Click "Disconnect"
   POST /api/v1/payment/connect/disconnect
   Status: 200
   Response Body: { message: "Stripe account disconnected successfully" }

2. Auto-refresh
   GET /api/v1/payment/connect/status
   Status: 200
   Response Body: { data: { status: "not_connected", url: null } }
```

---

## Expected Test Results

### ✅ All Tests Pass
- Seller can connect Stripe account
- Status updates automatically after connection
- Disconnect works properly
- Refresh button works
- Multiple sellers don't interfere with each other
- No errors in console or network tab

### ⚠️ Known Stripe Limitations
- Verification might take 1-2 business days (in production)
- Test mode usually instant
- Some requirements may appear if account is flagged

### 🐛 If Something Still Breaks
1. Check backend logs for [Stripe] messages
2. Check browser console for errors
3. Check Network tab response bodies
4. Restart both servers
5. Clear browser cache (Ctrl+Shift+Delete)

---

## Success Indicators

When everything works correctly, you should see:

✅ "Connected ✓" status with green checkmark
✅ Account ID displayed: `acct_1234567...`
✅ "Disconnect" button visible (when connected)
✅ "Connect" button visible (when not connected)
✅ Status updates within 2 seconds after Stripe redirect
✅ Toast messages for all actions
✅ No errors in browser console
✅ No errors in backend terminal (except normal request logs)

---

## Command Cheat Sheet

```bash
# Start backend
cd GameDay-Relics
npm run dev

# Start frontend (in new terminal)
cd frontend
npm run dev

# View backend logs (running in terminal)
# Look for lines starting with [Stripe

# View frontend logs
# F12 → Console tab in browser

# Check if backends are running
# Backend: curl http://localhost:8000/health
# Frontend: http://localhost:5173 (should load)
```

---

## Questions?

If tests fail, check:
1. Backend terminal for [Stripe] log messages
2. Browser Network tab for API responses
3. Browser Console for JavaScript errors
4. Database for paymentDetails object
5. Environment variables (STRIPE_PUBLIC_KEY, STRIPE_SECRET_KEY, STRIPE_CLIENT_ID)
