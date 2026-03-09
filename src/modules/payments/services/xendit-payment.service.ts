// src/modules/payments/services/xendit-payment.service.ts

import { Injectable, BadRequestException, GatewayTimeoutException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Xendit from 'xendit-node';
import { XenditProcessDto } from '../dto/xendit-process.dto';
import {
  XENDIT_PAYMENT_METHODS,
  XenditChannelConfig,
} from '../../../config/xendit-payment-methods.config';
import { PaymentSession } from '../entities/payment-session.entity';
import { BookingsService } from '../../bookings/bookings.service';
import { UsersService } from '../../users/users.service';

/** Xendit API 호출 타임아웃 (ms). 이 시간 내 응답 없으면 504 반환 */
const XENDIT_REQUEST_TIMEOUT_MS = 18_000;
/** processPayment 전체 타임아웃(ms). DB 또는 Xendit 지연 시 무한 로딩 방지 */
const PROCESS_PAYMENT_TOTAL_TIMEOUT_MS = 20_000;

@Injectable()
export class XenditPaymentService {
  private xendit: any;
  private readonly logger = new Logger(XenditPaymentService.name);

  constructor(
    private configService: ConfigService,
    @InjectRepository(PaymentSession)
    private paymentSessionRepository: Repository<PaymentSession>,
    private bookingsService: BookingsService,
    private usersService: UsersService,
  ) {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    if (!secretKey || typeof secretKey !== 'string' || secretKey.trim() === '') {
      this.logger.warn('XENDIT_SECRET_KEY is not set — payment requests will fail. Set it in .env');
    }
    this.xendit = new Xendit({ secretKey: secretKey || '' });
  }

  /**
   * Process payment request based on selected method.
   * Xendit API: https://api.xendit.co — 전체 흐름에 타임아웃 적용으로 무한 로딩 방지.
   */
  async processPayment(dto: XenditProcessDto) {
    const secretKey = this.configService.get<string>('XENDIT_SECRET_KEY');
    if (!secretKey || secretKey.trim() === '') {
      throw new BadRequestException(
        'Xendit is not configured (XENDIT_SECRET_KEY missing). Set XENDIT_SECRET_KEY in .env.',
      );
    }

    this.logger.log('processPayment started — will call Xendit API');

    const totalTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('PROCESS_PAYMENT_TOTAL_TIMEOUT')),
        PROCESS_PAYMENT_TOTAL_TIMEOUT_MS,
      ),
    );

    const work = this.runProcessPayment(dto);

    try {
      return await Promise.race([work, totalTimeoutPromise]);
    } catch (e: any) {
      if (e?.message === 'PROCESS_PAYMENT_TOTAL_TIMEOUT') {
        this.logger.warn(
          `processPayment timeout (${PROCESS_PAYMENT_TOTAL_TIMEOUT_MS / 1000}s) - DB or Xendit did not respond`,
        );
        throw new GatewayTimeoutException(
          'Payment request timed out (Xendit or DB did not respond in time). Check XENDIT_SECRET_KEY in .env and network to https://api.xendit.co',
        );
      }
      throw e;
    }
  }

  /**
   * 실제 결제 처리 로직 (타임아웃으로 감싸기 위해 분리)
   */
  private async runProcessPayment(dto: XenditProcessDto) {
    // 1. Validate payment session
    const session = await this.validatePaymentSession(dto.payment_session_id);

    // 2. Get payment method configuration
    const methodConfig = XENDIT_PAYMENT_METHODS[dto.payment_method];

    if (!methodConfig) {
      throw new BadRequestException(
        `Unsupported payment method: ${dto.payment_method}`,
      );
    }

    // 3. Validate card details if required
    if (methodConfig.requires_card_details && !dto.card_details) {
      throw new BadRequestException(
        'Card details are required for card payments',
      );
    }

    // 4. 앱에서 보낸 bookingId(= bookings.id)로 DB 조회 → 해당 행의 booking_number를 Xendit에 전달
    const bookingIdFromRequest = dto.booking_id || session.booking_id;
    let bookingNumber: string;
    try {
      const booking = await this.bookingsService.findOne(bookingIdFromRequest);
      bookingNumber = booking.bookingNumber;
    } catch {
      throw new BadRequestException(
        `Booking not found for id ${bookingIdFromRequest}. Use the booking table id (UUID) as bookingId.`,
      );
    }
    const consumer = await this.usersService.findOne(session.buyer_id);
    const consumerEmail = consumer?.email ?? '';
    const consumerPhone = consumer?.phone ?? '';
    const consumerName = consumer
      ? `${consumer.firstName ?? ''} ${consumer.lastName ?? ''}`.trim()
      : '';

    // 5. Build Xendit payment request
    const xenditRequest = this.buildXenditRequest(
      session,
      dto,
      methodConfig,
      { bookingNumber, consumerEmail, consumerPhone, consumerName },
    );

    this.logger.log('Request payload: ' + JSON.stringify(xenditRequest, null, 2));

    // 6. Call Xendit API (https://api.xendit.co) — 별도 타임아웃
    this.logger.log('Calling Xendit API (createPaymentRequest)...');
    const xenditCall = this.xendit.PaymentRequest.createPaymentRequest({
      data: xenditRequest,
    });
    const xenditTimeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error('Xendit API request timed out')),
        XENDIT_REQUEST_TIMEOUT_MS,
      ),
    );

    let xenditResponse: any;
    try {
      xenditResponse = await Promise.race([xenditCall, xenditTimeoutPromise]);
      this.logger.log('Xendit API responded successfully');
    } catch (error: any) {
      if (error?.message === 'Xendit API request timed out') {
        this.logger.warn(
          'Xendit API timeout - no response within ' + XENDIT_REQUEST_TIMEOUT_MS / 1000 + 's',
        );
        throw new GatewayTimeoutException(
          'Xendit API did not respond in time. Check XENDIT_SECRET_KEY and connectivity to https://api.xendit.co',
        );
      }
      throw new BadRequestException(
        `Xendit payment creation failed: ${error?.message ?? error}`,
      );
    }

    // 7. Store Xendit response
    await this.updatePaymentSession(dto.payment_session_id, {
      xendit_payment_id: xenditResponse.id,
      xendit_payment_request_id: xenditResponse.payment_request_id,
      payment_method: dto.payment_method,
      channel_code: methodConfig.channel_code,
      payment_url: this.extractPaymentUrl(xenditResponse),
      qr_code: this.extractQrCode(xenditResponse),
      status: xenditResponse.status,
      expires_at: xenditResponse.actions?.[0]?.expires_at,
    });

    return {
      xendit_payment_id: xenditResponse.id,
      payment_request_id: xenditResponse.payment_request_id,
      payment_url: this.extractPaymentUrl(xenditResponse),
      qr_code: this.extractQrCode(xenditResponse),
      redirect_required: methodConfig.requires_redirect,
      payment_method: dto.payment_method,
      status: xenditResponse.status,
      expires_at: xenditResponse.actions?.[0]?.expires_at,
      instructions: this.getPaymentInstructions(dto.payment_method),
    };
  }

  /**
   * Build Xendit payment request based on method
   * - reference_id: 결제 대상 예약의 booking_number
   * - customer: consumer(user) 기준 reference_id=booking_number, email, mobile_number
   * - metadata: contract_id, booking_id=booking_number
   */
  private buildXenditRequest(
    session: PaymentSession,
    dto: XenditProcessDto,
    methodConfig: XenditChannelConfig,
    context: {
      bookingNumber: string;
      consumerEmail: string;
      consumerPhone: string;
      consumerName: string;
    },
  ) {
    const { bookingNumber, consumerEmail, consumerPhone, consumerName } = context;

    const baseRequest = {
      reference_id: bookingNumber,
      type: 'PAY',
      country: 'PH',
      currency: 'PHP',
      channel_code: methodConfig.channel_code,
      request_amount: session.total_amount,
      capture_method: 'AUTOMATIC',

      customer: {
        type: 'INDIVIDUAL',
        reference_id: bookingNumber,
        email: consumerEmail,
        mobile_number: consumerPhone,
      },

      metadata: {
        payment_session_id: dto.payment_session_id,
        contract_id: session.contract_id,
        booking_id: bookingNumber,
        platform: 'gig-market',
        environment: process.env.NODE_ENV,
      },

      description: `Gig-Market service payment - ${bookingNumber}`,
    };

    const channelProperties = methodConfig.channel_properties({
      return_url: dto.return_url,
      card_details: dto.card_details,
      cardholder_name: consumerName,
    });

    return {
      ...baseRequest,
      channel_properties: channelProperties,
    };
  }

  /**
   * Extract payment URL from Xendit response
   */
  private extractPaymentUrl(xenditResponse: any): string | null {
    // Xendit returns actions array with URLs
    const action = xenditResponse.actions?.find(
      (a: any) => a.action === 'AUTH' || a.action === 'VIEW'
    );
    return action?.url || null;
  }

  /**
   * Extract QR code from Xendit response (for QR.ph)
   */
  private extractQrCode(xenditResponse: any): string | null {
    const qrAction = xenditResponse.actions?.find(
      (a: any) => a.action === 'QR_CHECKOUT'
    );
    return qrAction?.qr_code || null;
  }

  /**
   * Get user-friendly payment instructions
   */
  private getPaymentInstructions(method: string): string {
    const instructions = {
      GCASH: 'You will be redirected to GCash for payment authorization',
      PAYMAYA: 'You will be redirected to PayMaya to complete payment',
      QRPH: 'Scan the QR code with any QR.ph-enabled app',
      INSTAPAY: 'You will be redirected to select your bank for InstaPay transfer',
      CARD: 'You will be redirected to complete card authentication',
    };
    return instructions[method] || 'Complete payment in the redirect page';
  }

  /**
   * Validate payment session exists and is not expired
   */
  private async validatePaymentSession(sessionId: string) {
    const session = await this.paymentSessionRepository.findOne({
      where: { session_id: sessionId },
    });

    if (!session) {
      throw new BadRequestException('Payment session not found');
    }

    if (session.status === 'PAID') {
      throw new BadRequestException('Payment already completed');
    }

    if (session.expires_at < new Date()) {
      throw new BadRequestException('Payment session expired');
    }

    return session;
  }

  private async updatePaymentSession(
    sessionId: string,
    data: Partial<{
      xendit_payment_id: string;
      xendit_payment_request_id: string;
      payment_method: string;
      channel_code: string;
      payment_url: string | null;
      qr_code: string | null;
      status: string;
      expires_at: Date | null;
    }>,
  ) {
    const session = await this.paymentSessionRepository.findOne({
      where: { session_id: sessionId },
    });
    if (!session) return;
    Object.assign(session, data);
    await this.paymentSessionRepository.save(session);
  }
}
