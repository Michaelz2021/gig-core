/**
 * Xendit v3 REST API client
 * @see https://docs.xendit.co/apidocs
 * - Endpoint: POST https://api.xendit.co/v3/payment_requests
 * - Auth: Basic (secretKey + ':' base64)
 * - Header: api-version: 2024-11-11
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

const XENDIT_BASE_URL = 'https://api.xendit.co';
const API_VERSION = '2024-11-11';

export interface CreatePaymentRequestPayload {
  reference_id: string;
  type: 'PAY';
  country: string;
  currency: string;
  request_amount: number;
  capture_method?: 'AUTOMATIC' | 'MANUAL';
  channel_code: string;
  channel_properties: Record<string, any>;
  description?: string;
  metadata?: Record<string, string>;
  customer?: {
    type: 'INDIVIDUAL';
    reference_id: string;
    email?: string;
    mobile_number?: string;
    individual_detail?: {
      given_names: string;
      surname?: string;
    };
  };
}

export interface XenditPaymentRequestAction {
  type?: string;
  action?: string;
  value?: string;
  url?: string;
  qr_code?: string;
  descriptor?: string;
  expires_at?: string;
}

export interface CreatePaymentRequestResponse {
  id?: string;
  payment_request_id?: string;
  reference_id: string;
  type: string;
  status: string;
  request_amount: number;
  actions?: XenditPaymentRequestAction[];
  created?: string;
  updated?: string;
}
// Added invoice method here
export interface CreateInvoicePayload {
  external_id: string;
  amount: number;
  currency: string;
  description?: string;
  success_redirect_url?: string;
  failure_redirect_url?: string;
  payment_methods?: string[];
}

export interface CreateInvoiceResponse {
  id: string;
  external_id: string;
  status: string;
  invoice_url: string;
  amount: number;
  currency: string;
  description?: string;
}

// Xendit Payout API (v2) - sends money to provider's GCash or bank
// POST /v2/payouts
export interface CreatePayoutPayload {
  reference_id: string;       // our internal payout ID
  channel_code: string;       // e.g. PH_GCASH
  channel_properties: {
    account_number: string;   // phone number for GCash
    account_holder_name: string;
  };
  amount: number;
  description?: string;
  currency: string;
  receipt_notification?: {
    email_to?: string[];
  };
}

export interface CreatePayoutResponse {
  id: string;                 // Xendit's disbursement ID
  reference_id: string;
  channel_code: string;
  amount: number;
  currency: string;
  status: string;             // ACCEPTED, PENDING, etc.
  created: string;
  updated: string;
}
// End of added here
@Injectable()
export class XenditApiClient {
  private readonly logger = new Logger(XenditApiClient.name);
  private readonly client: AxiosInstance;

  constructor(configService: ConfigService) {
    const secretKey = configService.get<string>('XENDIT_SECRET_KEY') || '';
    const auth = Buffer.from(`${secretKey}:`, 'utf8').toString('base64');

    this.client = axios.create({
      baseURL: XENDIT_BASE_URL,
      timeout: 20_000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        'api-version': API_VERSION,
      },
    });
  }

  /**
   * Create payment request (v3)
   * POST /v3/payment_requests
   */
  async createPaymentRequest(
    payload: CreatePaymentRequestPayload,
  ): Promise<CreatePaymentRequestResponse> {
    const url = `${XENDIT_BASE_URL}/v3/payment_requests`;
    const requestText = [
      '========== Xendit API 요청 (REQUEST) ==========',
      `POST ${url}`,
      'Headers: Content-Type=application/json, api-version=' + API_VERSION + ', Authorization=Basic ***',
      'Body:',
      JSON.stringify(payload, null, 2),
      '================================================',
    ].join('\n');
    this.logger.log(requestText);

    const { data } = await this.client.post<CreatePaymentRequestResponse>(
      '/v3/payment_requests',
      payload,
    );

    const responseText = [
      '========== Xendit API 응답 (RESPONSE) ==========',
      'Status: 201',
      'Body:',
      JSON.stringify(data, null, 2),
      '================================================',
    ].join('\n');
    this.logger.log(responseText);

    return data;
  }
  // Added here: why v2? Because v3 is direct payment using the apps and v2 is for invoice
  async createInvoice(payload: CreateInvoicePayload): Promise<CreateInvoiceResponse> {
    this.logger.log(`[Xendit Invoice] POST /v2/invoices\n${JSON.stringify(payload, null, 2)}`);

    const { data } = await this.client.post<CreateInvoiceResponse>(
      '/v2/invoices',
      payload,
    );

    this.logger.log(`[Xendit Invoice Response]\n${JSON.stringify(data, null, 2)}`);

    return data;
  }
    async createPayout(payload: CreatePayoutPayload): Promise<CreatePayoutResponse> {
    this.logger.log(`[Xendit Payout] POST /v2/payouts\n${JSON.stringify(payload, null, 2)}`);

    const { data } = await this.client.post<CreatePayoutResponse>(
      '/v2/payouts',
      payload,
      {
        headers: {
          // Payout API requires Xendit-Idempotency-Key to prevent duplicate payouts
          'idempotency-key': payload.reference_id,
        },
      },
    );

    this.logger.log(`[Xendit Payout Response]\n${JSON.stringify(data, null, 2)}`);

    return data;
  }
}

