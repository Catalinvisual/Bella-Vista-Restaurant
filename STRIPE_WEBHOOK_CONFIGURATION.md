# Stripe Webhook Configuration Guide

This guide provides detailed instructions for configuring Stripe webhooks for the Bella Vista restaurant application in production.

## Overview

Webhooks allow Stripe to notify your application when events happen in your Stripe account, such as successful payments, failed payments, or canceled payment intents. This is essential for keeping your order status synchronized with payment status.

## Current Implementation

The webhook endpoint is located at `/api/payments/webhook` in the backend and handles the following events:

- `payment_intent.succeeded` - Payment completed successfully
- `payment_intent.payment_failed` - Payment failed
- `payment_intent.canceled` - Payment was canceled
- `payment_method.attached` - Payment method was attached to customer

## Production Setup Steps

### 1. Stripe Dashboard Configuration

1. **Access Stripe Dashboard**
   - Go to https://dashboard.stripe.com
   - Switch to your production account (if using test mode)

2. **Create Webhook Endpoint**
   - Navigate to `Developers` → `Webhooks`
   - Click `Add endpoint`
   - Enter endpoint URL: `https://bella-vista-backend.onrender.com/api/payments/webhook`
   - Select events to listen for:
     ```
     payment_intent.succeeded
     payment_intent.payment_failed
     payment_intent.canceled
     payment_method.attached
     ```

3. **Configure Webhook Settings**
   - **API Version**: Use latest (2023-10-16 or newer)
   - **Filter events**: Only select the events listed above
   - **Description**: "Bella Vista Restaurant - Payment Events"

### 2. Environment Configuration

#### Backend Environment Variables (Render)

Update these variables in your Render backend service:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx
STRIPE_TEST_MODE=false
```

#### Frontend Environment Variables (Render)

Update these variables in your Render frontend service:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
```

### 3. Security Considerations

#### Webhook Signature Verification

The webhook endpoint automatically verifies that requests are coming from Stripe using the webhook signature:

```javascript
try {
  event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  console.log(`✅ Webhook verified: ${event.type} (${event.id})`);
} catch (err) {
  console.error('⚠️ Webhook signature verification failed:', err.message);
  return res.status(400).send(`Webhook Error: ${err.message}`);
}
```

#### Raw Body Parsing

The webhook endpoint requires raw body parsing, which is configured in `server.js`:

```javascript
// Raw body parsing for Stripe webhooks
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
```

## Testing Webhooks

### 1. Test from Stripe Dashboard

1. Go to your webhook endpoint in Stripe Dashboard
2. Click `Send test webhook`
3. Select `payment_intent.succeeded`
4. Click `Send test webhook`
5. Check your backend logs for processing messages

### 2. Expected Log Output

Successful webhook processing should show:

```
✅ Webhook verified: payment_intent.succeeded (evt_1234567890)
💰 Payment succeeded: pi_1234567890 - Amount: 2000 eur
✅ Webhook processed successfully: payment_intent.succeeded
```

### 3. Test with Real Payments

1. Make a test purchase through your application
2. Monitor webhook delivery in Stripe Dashboard
3. Check backend logs for webhook processing
4. Verify order status updates correctly

## Webhook Event Handling

### Payment Intent Succeeded

```javascript
case 'payment_intent.succeeded':
  const paymentIntent = event.data.object;
  console.log(`💰 Payment succeeded: ${paymentIntent.id} - Amount: ${paymentIntent.amount} ${paymentIntent.currency}`);
  
  // TODO: Implement order status update
  // 1. Find order by payment_intent_id
  // 2. Update status to 'confirmed' or 'paid'
  // 3. Send confirmation email
  // 4. Notify restaurant staff
  break;
```

### Payment Intent Failed

```javascript
case 'payment_intent.payment_failed':
  const failedPayment = event.data.object;
  console.log(`❌ Payment failed: ${failedPayment.id} - Reason: ${failedPayment.last_payment_error?.message || 'Unknown'}`);
  
  // TODO: Implement failure handling
  // 1. Update order status to 'payment_failed'
  // 2. Send notification to customer
  // 3. Log for manual review
  break;
```

## Monitoring and Troubleshooting

### 1. Webhook Delivery Status

- Check delivery status in Stripe Dashboard
- Monitor response codes and timing
- Set up alerts for failed deliveries

### 2. Common Issues

#### Signature Verification Failed

**Symptoms:**
```
⚠️ Webhook signature verification failed: No signatures found matching the expected signature
```

**Solutions:**
- Verify `STRIPE_WEBHOOK_SECRET` is correct
- Ensure raw body parsing is configured
- Check webhook endpoint URL is correct

#### Webhook Secret Not Configured

**Symptoms:**
```
❌ STRIPE_WEBHOOK_SECRET not configured
```

**Solutions:**
- Add `STRIPE_WEBHOOK_SECRET` environment variable
- Restart the application after adding the variable

#### Timeout Issues

**Symptoms:**
- Webhook delivery timeouts in Stripe Dashboard
- No logs in backend

**Solutions:**
- Check backend service is running
- Verify endpoint URL is accessible
- Check for application errors

### 3. Debugging Tools

#### Enhanced Logging

The webhook endpoint includes comprehensive logging:

```javascript
console.error('Headers:', req.headers);
console.error('Body type:', typeof req.body);
console.error('Body length:', req.body ? req.body.length : 'undefined');
```

#### Stripe CLI

For local testing, use Stripe CLI:

```bash
# Install Stripe CLI
npm install -g stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to local development
stripe listen --forward-to localhost:5000/api/payments/webhook
```

## Production Checklist

- [ ] Webhook endpoint created in Stripe Dashboard
- [ ] Production webhook secret configured
- [ ] Production Stripe keys configured
- [ ] Test webhook delivery successful
- [ ] Real payment test completed
- [ ] Monitoring and alerts set up
- [ ] Error handling tested
- [ ] Logs reviewed and working

## Next Steps

After webhook configuration:

1. **Implement Order Status Updates**
   - Connect webhook events to database updates
   - Update order status based on payment events

2. **Add Email Notifications**
   - Send confirmation emails on successful payments
   - Send failure notifications on payment failures

3. **Implement Staff Notifications**
   - Notify restaurant staff of new confirmed orders
   - Set up order management workflow

4. **Add Monitoring**
   - Set up webhook delivery monitoring
   - Create alerts for failed payments
   - Monitor order processing metrics

## Support

For webhook-related issues:

1. Check Stripe Dashboard webhook logs
2. Review backend application logs
3. Verify environment configuration
4. Test with Stripe CLI for local debugging
5. Contact Stripe support for platform issues