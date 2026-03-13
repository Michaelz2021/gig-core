// src/config/xendit-payment-methods.config.ts

export interface XenditChannelConfig {
  channel_code: string;
  requires_redirect: boolean;
  requires_card_details: boolean;
  channel_properties: (data: any) => object;
}

export const XENDIT_PAYMENT_METHODS: Record<string, XenditChannelConfig> = {
  // ============================================
  // E-Wallets (Redirect-based)
  // ============================================
  GCASH: {
    channel_code: 'GCASH',
    requires_redirect: true,
    requires_card_details: false,
    channel_properties: (data) => ({
      success_return_url: data.return_url + '?status=success',
      failure_return_url: data.return_url + '?status=failed',
      cancel_return_url: data.return_url + '?status=cancelled',
      // redirect -> return_url 
    }),
  },

  PAYMAYA: {
    channel_code: 'PAYMAYA',
    requires_redirect: true,
    requires_card_details: false,
    channel_properties: (data) => ({
      success_return_url: data.return_url + '?status=success',
      failure_return_url: data.return_url + '?status=failed',
      cancel_return_url: data.return_url + '?status=cancelled',
      // redirect -> return_url
    }),
  },

  // ============================================
  // QR Code (Display QR, no redirect)
  // ============================================
  QRPH: {
    channel_code: 'QRPH',
    requires_redirect: false,
    requires_card_details: false,
    channel_properties: (data) => ({
      // QR.ph doesn't need redirect URLs
      // QR code will be generated and displayed
    }),
  },

  // ============================================
  // Bank Transfer (InstaPay)
  // ============================================
  INSTAPAY: {
    channel_code: 'INSTAPAY',
    requires_redirect: true,
    requires_card_details: false,
    channel_properties: (data) => ({
      success_return_url: data.return_url + '?status=success',
      failure_return_url: data.return_url + '?status=failed',
      // redirect -> return_url
    }),
  },

  // ============================================
  // Credit/Debit Cards
  // ============================================
  CARD: {
    channel_code: 'CARD',
    requires_redirect: true,
    requires_card_details: true,
    channel_properties: (data) => ({
      success_return_url: data.return_url + '?status=success',
      failure_return_url: data.return_url + '?status=failed',
      // redirect -> return_url
      
      // Card tokenization (3DS flow)
      card_information: {
        card_number: data.card_details.card_number,
        exp_month: data.card_details.exp_month,
        exp_year: data.card_details.exp_year,
        cvv: data.card_details.cvv,
        cardholder_name: data.cardholder_name || '',
      },
    }),
  },
};
