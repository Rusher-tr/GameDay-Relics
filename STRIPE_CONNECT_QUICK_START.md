# Stripe Connected Accounts - Quick Start Guide

## What Was Implemented

A complete **Stripe Connected Accounts** system for automated seller payouts. This allows:
- Sellers to connect their Stripe accounts to the platform
- Automatic transfers from admin account to seller accounts when orders complete
- Admin dashboard tracking of payout status
- Fallback to manual payment if seller hasn't connected Stripe

## For Sellers: How to Get Started

### Step 1: Access Payment Settings
1. Login to your seller account
2. Click your username in navbar → "Payment Settings"
3. Or go to "My Products" → "Payment Settings" button

### Step 2: Connect Stripe Account
1. Click blue "Connect Stripe Account" button
2. You'll be redirected to Stripe's secure page
3. Follow Stripe's onboarding process:
   - Enter personal/business information
   - Provide bank account details
   - Complete identity verification
   - Set up payout schedule

### Step 3: Complete Verification
1. Stripe will verify your information (usually within minutes)
2. Return to Payment Settings page
3. Click "Refresh Status" to see latest status
4. Once verified, status will show "Connected ✓"

### Step 4: Receive Automatic Payouts
1. When buyers complete orders, funds go to escrow
2. Admin releases escrow payment
3. Your connected Stripe account automatically receives the transfer
4. Funds appear in your Stripe balance (1-2 business days to settle)
5. Withdraw to your bank account from Stripe dashboard

## For Admins: Managing Payouts

### Releasing Escrow Payment

1. Go to Admin Dashboard → Escrow tab
2. Review buyer feedback status
3. When ready, click "Release Payment to Seller"

**What happens:**
- **If seller has Stripe connected:** Automatic transfer created immediately
  - Shows "Payout Status: ✅ Completed"
  - Shows transfer ID
- **If seller hasn't connected Stripe:** Manual payment info displayed
  - Shows seller's bank account details
  - You must process the transfer manually
  - Status shows "Pending" until marked as done

### Checking Transfer Status

1. In Admin Dashboard → Escrow tab
2. For orders with Stripe transfers, click "Check Status" button
3. View transfer details:
   - Transfer ID
   - Amount
   - Status (Pending/Completed/Failed)
   - Creation date

## API Endpoints

### Seller Endpoints
```
POST /api/v1/payment/connect/create-link
Creates Stripe onboarding link
Response: { url: "https://..." }

GET /api/v1/payment/connect/status
Check account connection status
Response: { status: "connected|pending|not_connected", accountId, chargesEnabled, ... }

POST /api/v1/payment/connect/disconnect
Disconnect Stripe account
Response: { message: "Disconnected successfully" }
```

### Admin Endpoints
```
POST /api/v1/admins/escrow/{escrowId}/release
Release escrow (now with Stripe transfer support)
Response: { paymentMethod: "stripe_connected_account|manual", transfer|sellerPaymentInfo }

GET /api/v1/admins/orders/{orderId}/transfer-status
Check specific transfer status
Response: { transfer: {id, amount, status, ...}, orderPayoutStatus }
```

## Key Features

✅ **Automatic Transfers** - Funds transferred automatically when escrow is released
✅ **Fallback Option** - Manual payment processing still available
✅ **Real-time Tracking** - Check transfer status anytime
✅ **Audit Logging** - All transfers recorded in audit logs
✅ **Seller Control** - Connect/disconnect account anytime
✅ **PKR Support** - All amounts in Pakistani Rupees

## Testing the Flow

### Sandbox Mode (Testing)
```
1. Backend runs on: http://localhost:8000
2. Frontend runs on: http://localhost:5173
3. Use Stripe Test Mode API keys from STRIPE_SECRET_KEY
```

### Test Sellers
1. Create a seller account
2. Go to Payment Settings
3. Click "Connect Stripe Account"
4. You'll see Stripe Test Onboarding
5. Use test data to complete verification
6. Return to Payment Settings
7. Status should show "Connected"

### Test Order Flow
1. Create a buyer account
2. Purchase a product from test seller
3. Complete payment (use Stripe test card: 4242 4242 4242 4242)
4. Order goes to Escrow
5. Buyer marks as satisfied
6. Admin releases escrow
7. Automatic transfer created to seller's Stripe account
8. Check transfer status to verify

## Troubleshooting

### Seller Stripe Not Connecting
- Check browser console for errors
- Verify Stripe API keys are correct
- Confirm FRONTEND_URL environment variable is set
- Make sure seller role is properly set

### Transfer Not Creating
- Check that seller has `stripeConnectedAccountId` set
- Verify seller's account has `chargesEnabled: true`
- Check admin dashboard error messages
- Review backend logs for Stripe API errors

### Transfer Status Showing "Failed"
- Check order model for transfer ID
- Use transfer ID to look up in Stripe dashboard
- Common reasons: Account restricted, insufficient balance, verification failed
- Contact seller to verify Stripe account is active

## Files Changed

### Backend
- `models/user.models.js` - Added Stripe fields
- `models/order.models.js` - Added transfer tracking
- `controllers/payment.controller.js` - Added 3 endpoints
- `controllers/admin.controller.js` - Updated escrow release
- `routes/payment.routes.js` - Added 3 routes
- `routes/admin.routes.js` - Added status check route

### Frontend
- `pages/PaymentSettingsPage.tsx` - NEW: Seller payment settings
- `App.tsx` - Added route
- `Navbar.tsx` - Added menu item
- `AdminDashboard.tsx` - Added payout status display
- `SellerProductsPage.tsx` - Added settings button

## Environment Variables Needed

```
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_CLIENT_ID=ca_test_...
FRONTEND_URL=http://localhost:5173
```

## Database Schema Changes

### User Model (paymentDetails)
```javascript
{
  stripeConnectedAccountId: String,      // acct_1234567...
  stripeOnboardingStatus: String,        // 'pending', 'completed', 'rejected'
  stripeOnboardingUrl: String,           // https://connect.stripe.com/...
}
```

### Order Model
```javascript
{
  transferId: String,                    // tr_1234567... or null
  payoutStatus: String,                  // 'pending', 'succeeded', 'failed'
  payoutInitiatedAt: Date,               // 2024-01-15T10:30:00Z
  payoutCompletedAt: Date,               // 2024-01-15T10:31:00Z or null
}
```

## Success Indicators

✅ Seller can access Payment Settings page
✅ Seller can click "Connect Stripe Account"
✅ Stripe onboarding URL works
✅ After onboarding, status updates to "Connected"
✅ Admin can release escrow for seller
✅ Transfer created in Stripe Dashboard
✅ Admin can check transfer status
✅ Audit logs record the transfer
✅ Payout appears in seller's Stripe balance

## Next Steps

1. ✅ Implementation complete
2. ⏳ Test all flows end-to-end
3. ⏳ Deploy to production Stripe account
4. ⏳ Monitor first few transfers
5. ⏳ Gather seller feedback
6. ⏳ Plan future enhancements (webhooks, analytics, etc.)

---

**Need Help?** Check the detailed implementation doc: `STRIPE_CONNECT_IMPLEMENTATION.md`
