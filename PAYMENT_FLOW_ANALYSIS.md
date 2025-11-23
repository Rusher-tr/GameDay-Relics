# GameDay-Relics Payment Architecture Analysis & Seller Payout Strategy

## Current Payment Flow

### 1. **Buyer Payment (Incoming)**
```
Buyer → Stripe Checkout → Admin Stripe Account (receives full amount)
  ↓
  Payment webhook verifies transaction
  ↓
  Order status: "pending" → "Escrow"
  ↓
  Funds held in admin's Stripe account
  ↓
  7-day seller confirmation deadline set
```

**Files Involved:**
- `payment.controller.js` - Creates Stripe checkout session in PKR currency
- `webhook.controller.js` - Listens for `checkout.session.completed` event
- `order.models.js` - Stores `transactionId`, `escrowRelease` flag, `sellerConfirmationDeadline`

### 2. **Escrow Release (Manual/Hardcoded)**
```
Admin manually releases escrow (or auto-release after seller confirmation)
  ↓
  Order status: "Escrow" → "Completed"
  ↓
  escrowRelease: true
  ↓
  Admin gets seller's payment details (JazzCash, EasyPaisa, Bank account, etc.)
  ↓
  Admin manually transfers funds OUT OF SYSTEM
  ↓
  ❌ NO AUTOMATED PAYMENT PROCESSED
```

**Current Issue:** Escrow release only returns seller's payment gateway info. Actual payment is manual/external.

---

## Proposed Solution: Stripe Connected Accounts + Payouts

### Architecture for Automated Seller Payouts

```
┌─────────────────────────────────────────────────────────────┐
│                     PAYMENT FLOW V2                         │
├─────────────────────────────────────────────────────────────┤

STEP 1: BUYER PAYMENT (Unchanged)
Buyer (Card) → Stripe Checkout → Admin Account (collects payment)
  ↓
  Order Status: "Escrow" (funds held)

STEP 2: SELLER ONBOARDING (New)
Seller → Connects Stripe Account → Admin Platform
  ↓
  Seller provides Stripe Account ID (connected account)
  ↓
  Stored in User model: paymentDetails.stripeConnectedAccountId

STEP 3: AUTOMATED PAYOUT (New)
Admin releases escrow
  ↓
  System creates Stripe Transfer (admin → seller's connected account)
  ↓
  OR creates Stripe Payout (directly to seller's bank/card)
  ↓
  Order marked as "Completed"
  ↓
  Seller receives funds in their Stripe account
  ↓
  Seller can withdraw to their bank account
```

---

## Implementation Strategy

### Option A: Stripe Connected Accounts (RECOMMENDED)

**Pros:**
- ✅ Fully automated
- ✅ Seller keeps own Stripe account
- ✅ Direct transfers between accounts
- ✅ Platform takes percentage/fee if needed
- ✅ Seller has full control over funds

**Cons:**
- ❌ Seller must set up Stripe account separately
- ❌ More KYC requirements

**How It Works:**
1. Seller connects their Stripe account to your platform (OAuth flow)
2. You store seller's `stripeConnectedAccountId`
3. When releasing escrow, you create a transfer from admin to seller's account
4. Seller can withdraw funds to their bank from their Stripe dashboard

**Implementation:**
```javascript
// 1. Create transfer from admin account to seller's connected account
const transfer = await stripe.transfers.create({
  amount: order.amount * 100, // in cents
  currency: 'pkr',
  destination: seller.paymentDetails.stripeConnectedAccountId, // Seller's connected account ID
  metadata: {
    orderId: order._id.toString(),
    sellerId: seller._id.toString()
  }
});

// 2. Update order
order.escrowRelease = true;
order.status = 'Completed';
order.transferId = transfer.id; // Track transfer
```

---

### Option B: Stripe Payouts (Direct to Bank/Card)

**Pros:**
- ✅ Direct payment to seller's bank/card
- ✅ No need for seller Stripe account

**Cons:**
- ❌ Higher fees
- ❌ Less control for seller
- ❌ Manual bank details required
- ❌ International payouts costly

**How It Works:**
1. Seller provides bank account/card details
2. You store encrypted details
3. When releasing escrow, create Stripe payout

**Note:** This requires seller to have valid bank account in Pakistan, and Stripe's payout network must support PKR.

---

### Option C: Hybrid Approach (BEST FOR YOUR CASE)

**Supports Multiple Payment Methods:**
1. **Preferred: Stripe Connected Account** (automated)
2. **Fallback: JazzCash/EasyPaisa** (needs integration)
3. **Fallback: Direct Bank Transfer** (manual)

---

## About JazzCash & EasyPaisa

**Important Reality Check:**

❌ **JazzCash & EasyPaisa don't have official APIs** (or are severely limited)
- Mainly mobile wallet services
- No direct programmatic payout capability
- Usually require manual transfers

❌ **Stripe cannot directly pay to JazzCash/EasyPaisa**
- These aren't integrated with Stripe Payouts API
- Would need separate integration service

✅ **What you CAN do:**
1. Stripe → Pakistani Bank Account → Seller initiates transfer to their JazzCash/EasyPaisa
2. Use payment service like **NayaPay** (which supports JazzCash/EasyPaisa)
3. Implement 1LINK for card payments (Visa) with separate payout system

---

## Recommended Implementation for Your Case

### Use Stripe Connected Accounts (Easiest)

#### Step 1: Update User Model
```javascript
// user.models.js - Add to paymentDetails
paymentDetails: {
  accountType: { // 'stripe', 'bank', 'wallet'
    type: String,
    enum: ['stripe', 'bank', 'wallet'],
    default: 'stripe'
  },
  stripeConnectedAccountId: String, // For Option A
  bankAccountNumber: String, // For Option B (encrypted)
  bankRoutingNumber: String, // For Option B
  jazzcashNumber: String, // For manual transfer
  easyPaisaNumber: String, // For manual transfer
}
```

#### Step 2: Create Seller Onboarding Endpoint
```javascript
// payment.controller.js
const createStripeConnectLink = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;
  
  // Create Stripe account link for onboarding
  const accountLink = await stripe.accountLinks.create({
    account: seller.paymentDetails.stripeConnectedAccountId,
    type: 'account_onboarding',
    refresh_url: `${frontendUrl}/seller/stripe-reauth`,
    return_url: `${frontendUrl}/seller/stripe-complete`
  });
  
  // Redirect seller to Stripe onboarding
  res.json({ url: accountLink.url });
});
```

#### Step 3: Automate Escrow Release
```javascript
// admin.controller.js - Update releaseEscrowPayment
const releaseEscrowPayment = asyncHandler(async (req, res) => {
  // ... existing validation ...
  
  // Check if seller has Stripe connected account
  if (seller.paymentDetails.accountType === 'stripe' && 
      seller.paymentDetails.stripeConnectedAccountId) {
    
    // Create automated transfer
    const transfer = await stripe.transfers.create({
      amount: order.amount * 100,
      currency: 'pkr',
      destination: seller.paymentDetails.stripeConnectedAccountId,
      metadata: {
        orderId: order._id.toString(),
        sellerId: seller._id.toString()
      }
    });
    
    order.escrowRelease = true;
    order.status = 'Completed';
    order.transferId = transfer.id;
    await order.save();
    
    return res.json({
      message: "Payout initiated automatically",
      transferId: transfer.id,
      status: "succeeded"
    });
  }
  
  // Fallback: Manual payment (existing behavior)
  // Return seller payment details for manual processing
});
```

#### Step 4: Track Payouts
```javascript
// Add to Order model
transferId: String, // Stripe transfer/payout ID
payoutStatus: { // 'pending', 'succeeded', 'failed'
  type: String,
  enum: ['pending', 'succeeded', 'failed'],
  default: 'pending'
}
```

---

## Using NayaPay for JazzCash/EasyPaisa (Alternative)

If sellers prefer JazzCash/EasyPaisa:

```
Your Admin Stripe Account
  ↓
  Withdraw to your PKR bank account
  ↓
  Use NayaPay API to transfer to seller's JazzCash/EasyPaisa
  ↓
  Seller receives in their mobile wallet
```

**But this requires:**
1. Manual withdrawal from Stripe
2. Managing separate liquidity
3. Additional integration with NayaPay
4. Higher complexity

---

## Recommended Stack for Your Use Case

| Component | Solution | Notes |
|-----------|----------|-------|
| **Buyer Payment** | Stripe Checkout ✅ | Currently working |
| **Fund Holding** | Stripe Admin Account ✅ | Escrow in Stripe |
| **Seller Payout** | Stripe Transfers (Connected Accounts) | **Implement this** |
| **Fallback** | Manual Bank Transfer | For non-Stripe sellers |
| **Mobile Wallets** | NayaPay Integration | Future enhancement |

---

## Can You Use 1LINK Cards for Payouts?

**1LINK** is a Pakistani payment network similar to Visa/MasterCard.

✅ **For Buyer Payments:** Yes, Stripe supports 1LINK cards
✗ **For Seller Payouts:** No, not directly from Stripe

You would need to:
1. Partner with 1LINK for merchant payouts
2. Or integrate separate PSP that supports 1LINK payouts

---

## Implementation Timeline

### Phase 1: Quick Win (1-2 days)
- [x] Understand current flow
- [ ] Set up Stripe Connected Accounts documentation
- [ ] Create seller onboarding UI
- [ ] Implement payout transfer logic

### Phase 2: Full Automation (3-5 days)
- [ ] Seller Stripe connect OAuth flow
- [ ] Automated transfer on escrow release
- [ ] Track transfer status
- [ ] Error handling & retry logic

### Phase 3: Enhancements (Future)
- [ ] NayaPay integration for JazzCash/EasyPaisa
- [ ] Multiple payout methods per seller
- [ ] Payout scheduling (weekly/monthly)
- [ ] Admin dashboard for payout management

---

## Security Considerations

⚠️ **Important:**

1. **Never store bank details unencrypted**
   - Use Stripe's data encryption
   - Or encrypt sensitive fields

2. **API Keys**
   - Use environment variables
   - Rotate keys regularly
   - Never commit secrets

3. **PCI Compliance**
   - Don't handle raw card data
   - Use Stripe's payment method tokens
   - For bank accounts, use Stripe Verification

4. **Rate Limiting**
   - Prevent automated payout abuse
   - Limit payout frequency

5. **Audit Logging**
   - Log all transfers
   - Store transfer IDs
   - Track payout timeline

---

## Next Steps

1. **Review this flow** with your team
2. **Choose Option A (Connected Accounts)** as primary
3. **Start with Seller Onboarding UI**
4. **Implement automated transfers**
5. **Test in Stripe sandbox**
6. **Deploy and monitor**

Would you like me to implement any of these components?
