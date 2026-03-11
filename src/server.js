require('dotenv').config();

const express = require('express');
const axios = require('axios'); // Without this, the xendit won't let me do postman
const app = express();
app.use(express.json());

// ── Xendit v3 direct (same as boss's xendit-api.client.ts) 
const XENDIT_BASE_URL = 'https://api.xendit.co';
const API_VERSION = '2024-11-11';
const secretKey = process.env.XENDIT_SECRET_KEY;
const auth = Buffer.from(`${secretKey}:`, 'utf8').toString('base64'); // Xendit basic authentication, convert to format for Xendit


const xenditAxios = axios.create({
  baseURL: XENDIT_BASE_URL,
  timeout: 20_000,
  headers: {
    'Content-Type':  'application/json', // The base URL so you only need to write /v3/payment_requests not the full URL
    'Authorization': `Basic ${auth}`, // Your auth key so Xendit knows it's you
    'api-version':   API_VERSION, // The API version so Xendit uses v3
  },
});

const ALLOWED_AMOUNTS  = [100, 200, 300, 500, 1000];
const SUCCESS_URL = 'https://xendit.co/success';
const FAILURE_URL = 'https://xendit.co/failure';

app.post('/payment/topup', async (req, res) => {
  try {
    let { amount, payment_method, card_details } = req.body;
// Requires an amount
    amount = Number(amount);
    if (!ALLOWED_AMOUNTS.includes(amount)) {
      return res.status(400).json({ success: false, message: `Invalid amount. Allowed: ${ALLOWED_AMOUNTS.join(', ')}` });
    }
// The only allowed payment channels:
    payment_method = String(payment_method).toUpperCase();
    const ALLOWED_METHODS = ['GCASH', 'PAYMAYA', 'CARD', 'INSTAPAY', 'CARD_INVOICE', 'QRPH'];
    if (!ALLOWED_METHODS.includes(payment_method)) {
      return res.status(400).json({ success: false, message: `Invalid payment_method. Allowed: ${ALLOWED_METHODS.join(', ')}` });
    }
// All payment channels
    let channel_code;
    let channel_properties;
    const referenceId = `topup-test-${Date.now()}`;
    switch (payment_method) {
      case 'GCASH':
        channel_code = 'GCASH';
        channel_properties = { success_return_url: SUCCESS_URL, failure_return_url: FAILURE_URL, cancel_return_url: FAILURE_URL };
        break;
      case 'PAYMAYA':
        channel_code = 'PAYMAYA';
        channel_properties = { success_return_url: SUCCESS_URL, failure_return_url: FAILURE_URL, cancel_return_url: FAILURE_URL };
        break;
      case 'INSTAPAY':
        // InstaPay uses Xendit Invoice (Payment Link) instead of v3 Payment Request
        const invoiceResponse = await xenditAxios.post('/v2/invoices', {
          external_id: referenceId,
          amount: amount,
          currency: 'PHP',
          description: `Wallet top-up ₱${amount} via InstaPay`,
          success_redirect_url: SUCCESS_URL,
          failure_redirect_url: FAILURE_URL,
          // payment_methods: ['INSTAPAY_ONLINE_BANKING'], // only show InstaPay
        });

        console.log('\n[Xendit Invoice] Response:', JSON.stringify(invoiceResponse.data, null, 2));

        return res.json({
          success: true,
          data: {
            reference_id: referenceId,
            xendit_payment_id: invoiceResponse.data.id,
            amount,
            payment_method: 'INSTAPAY',
            payment_url: invoiceResponse.data.invoice_url, // open this in InAppBrowser
            qr_code: null, // lagay nalang po kayo rito
            redirect_required: true,
            status: invoiceResponse.data.status,
          },
        });
      case 'CARD':
          if (!card_details) {
            return res.status(400).json({ 
              success: false, 
              message: 'card_details is required for CARD payments',
            });
          }
          const nameParts = (card_details.cardholder_name || '').split(' ');
          channel_code = 'CARDS';
          channel_properties = {
            success_return_url: SUCCESS_URL,
            failure_return_url: FAILURE_URL,
            skip_three_ds: false, 
            card_details: {                              // nested inside card_details
              card_number: card_details.card_number,
              expiry_month: card_details.exp_month,
              expiry_year: card_details.exp_year,
              cvn: card_details.cvv,
              cardholder_first_name: nameParts[0] ?? '',
              cardholder_last_name: nameParts.slice(1).join(' ') ?? '',
              cardholder_email: card_details.cardholder_email,
            },
          };
          break;
      case 'CARD_INVOICE':
        const invoiceCard = await xenditAxios.post('/v2/invoices', {
          external_id: referenceId,
          amount: amount,
          currency: 'PHP',
          description: `Wallet top-up ₱${amount} via Card`,
          success_redirect_url: SUCCESS_URL,
          failure_redirect_url: FAILURE_URL,
          payment_methods: ['CREDIT_CARD'],
        });

        return res.json({
          success: true,
          data: {
            reference_id: referenceId,
            xendit_payment_id: invoiceCard.data.id,
            amount,
            payment_method: 'CARD_INVOICE',
            payment_url: invoiceCard.data.invoice_url,
            qr_code: null,
            redirect_required: true,
            status: invoiceCard.data.status,
          },
        });

        case 'QRPH':
        channel_code = 'QRPH';
        channel_properties = {};
        break;
    }

    const payload = {
      reference_id: referenceId, // your unique ID for this transaction
      type: 'PAY', // always one-time payments
      country: 'PH', 
      currency: 'PHP', 
      request_amount: amount, // 100, 200, 500, user choice
      capture_method: 'AUTOMATIC', // charge immediately, no manual confirmation
      channel_code, // (GCASH, PAYMAYA, INSTAPAY (invoice method only), Card (only works in Invoice method))
      channel_properties, // 
      description: `Wallet top-up ₱${amount} via ${payment_method}`,
      metadata: { type: 'wallet_topup', environment: 'test' }, // // extra info for your records
    };

    console.log('\n[Xendit] Payload:', JSON.stringify(payload, null, 2));

    const { data: response } = await xenditAxios.post('/v3/payment_requests', payload); // call Xendit

    console.log('\n[Xendit] Response:', JSON.stringify(response, null, 2));

    const actions = response.actions ?? []; // The one who got the say on what to do next?
    const redirectAction = actions.find(a => a.type === 'REDIRECT_CUSTOMER' || a.action === 'AUTH'); // send this user to this url
    const qrAction = actions.find(a => a.type === 'PRESENT_TO_CUSTOMER' || a.descriptor === 'QR_STRING'); // show the user this QR code

    return res.json({
      success: true,
      data: {
        reference_id: referenceId, // your reference ID
        xendit_payment_id: response.id, // Xendit's reference ID
        amount,
        payment_method, 
        payment_url: redirectAction?.value ?? redirectAction?.url ?? null, // URL to open
        qr_code: qrAction?.qr_code ?? qrAction?.value ?? null, // QR to display
        redirect_required: ['GCASH', 'PAYMAYA', 'CARD', 'INSTAPAY'].includes(payment_method), // does app need to open browser?
        status: response.status, // PENDING, REQUIRES_ACTION etc
        raw_actions: actions, // full actions for debugging
      },
    });

  } catch (error) {
    // Full error from Xendit
    const xenditError = error?.response?.data;
    console.error('\n[Xendit ERROR]', JSON.stringify(xenditError ?? error.message, null, 2));
    return res.status(500).json({
      success:  false,
      message:  xenditError?.message ?? error.message,
      error_code: xenditError?.error_code ?? null,
      details:  xenditError ?? null,
    });
  }
});

app.get('/payment/topup/success', (req, res) => res.json({ success: true,  message: 'Payment successful!', query: req.query }));
app.get('/payment/topup/failure', (req, res) => res.json({ success: false, message: 'Payment failed.',      query: req.query }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n✅ Xendit test server running on http://localhost:${PORT}`);
  console.log(`📬 Test endpoint: POST http://localhost:${PORT}/payment/topup`);
});