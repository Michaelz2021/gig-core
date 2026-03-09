// controllers/payout.controller.ts

import { Request, Response } from 'express';
import { PayoutService } from '../services/payout.service';
import { XenditDisbursementService } from '../services/xendit-disbursement.service';

// NOTE:
// 이 컨트롤러는 사용 예시용 Express 스타일 코드입니다.
// 실제 프로젝트에 연결하려면:
// 1) db 인스턴스 주입
// 2) PayoutService / XenditDisbursementService 구현
// 3) routes/payout.routes.ts 에서 Router에 연결

export async function getPayoutSummary(req: Request, res: Response) {
  try {
    const providerId = (req as any).user!.userId;

    // 출금 가능한 booking 조회
    const availablePayouts = await (global as any).db.bookings.find({
      provider_id: providerId,
      status: 'COMPLETED',
      payment_status: 'APPROVED',
      payout_status: 'AVAILABLE', // 아직 출금하지 않음
    });

    // Pending settlement (아직 consumer 승인 대기)
    const pendingPayouts = await (global as any).db.bookings.find({
      provider_id: providerId,
      status: 'COMPLETED',
      payment_status: 'PENDING_APPROVAL', // Consumer 48시간 review 기간
    });

    const summary = {
      total_available: availablePayouts.reduce(
        (sum: number, b: any) => sum + b.provider_amount,
        0,
      ),
      pending_amount: pendingPayouts.reduce(
        (sum: number, b: any) => sum + b.provider_amount,
        0,
      ),
      ready_count: availablePayouts.length,
      pending_count: pendingPayouts.length,
    };

    return res.json({
      success: true,
      data: {
        summary,
        available_payouts: availablePayouts.map((booking: any) => ({
          payout_id: `PO-${booking.booking_id}`,
          booking_number: booking.booking_number,
          service_name: booking.service_name,
          amount: booking.provider_amount,
          status: 'available',
          completed_at: booking.completed_at,
          contract_id: booking.contract_id,
          escrow_id: booking.escrow_id,
        })),
        recent_payouts: await getRecentPayouts(providerId, 5),
      },
    });
  } catch (error) {
    console.error('Get payout summary error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payout summary',
    });
  }
}

export async function getAvailablePayouts(req: Request, res: Response) {
  try {
    const providerId = (req as any).user!.userId;

    const bookings = await (global as any).db.bookings
      .find({
        provider_id: providerId,
        status: 'COMPLETED',
        payment_status: 'APPROVED',
        payout_status: 'AVAILABLE',
      })
      .sort({ completed_at: -1 });

    const payouts = bookings.map((booking: any) => ({
      payout_id: `PO-${booking.booking_id}`,
      booking_number: booking.booking_number,
      service_name: booking.service_name,
      amount: booking.provider_amount,
      status: 'available',
      completed_at: booking.completed_at,
      available_from: booking.payment_approved_at, // Consumer 승인한 시점
      contract_id: booking.contract_id,
      escrow_id: booking.escrow_id,
    }));

    return res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    console.error('Get available payouts error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch available payouts',
    });
  }
}

export async function getPayoutHistory(req: Request, res: Response) {
  try {
    const providerId = (req as any).user!.userId;
    const { page = 1, limit = 20 } = req.query;

    const offset = (Number(page) - 1) * Number(limit);

    const payouts = await (global as any).db.payouts
      .find({
        provider_id: providerId,
        status: 'COMPLETED',
      })
      .sort({ paid_at: -1 })
      .skip(offset)
      .limit(Number(limit));

    const total = await (global as any).db.payouts.count({
      provider_id: providerId,
      status: 'COMPLETED',
    });

    return res.json({
      success: true,
      data: payouts.map((p: any) => ({
        payout_id: p.payout_id,
        booking_number: p.booking_number,
        amount: p.amount,
        paid_at: p.paid_at,
        xendit_disbursement_id: p.xendit_disbursement_id,
        method: p.payment_method,
        account_reference: p.account_reference,
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        total_pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get payout history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch payout history',
    });
  }
}

export async function requestPayout(req: Request, res: Response) {
  try {
    const providerId = (req as any).user!.userId;
    const { booking_ids, payment_method, account_details } = req.body;

    // Validation
    if (!booking_ids || !Array.isArray(booking_ids) || booking_ids.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'At least one booking ID required',
      });
    }

    // Verify all bookings belong to provider and are available for payout
    const bookings = await (global as any).db.bookings.find({
      booking_id: { $in: booking_ids },
      provider_id: providerId,
      status: 'COMPLETED',
      payment_status: 'APPROVED',
      payout_status: 'AVAILABLE',
    });

    if (bookings.length !== booking_ids.length) {
      return res.status(400).json({
        success: false,
        error: 'Some bookings are not eligible for payout',
      });
    }

    const totalAmount = bookings.reduce(
      (sum: number, b: any) => sum + b.provider_amount,
      0,
    );

    // Create payout request
    const payoutId = `PO-${Date.now()}`;

    await (global as any).db.payouts.insert({
      payout_id: payoutId,
      provider_id: providerId,
      booking_ids,
      amount: totalAmount,
      payment_method: payment_method || 'gcash', // default
      account_details,
      status: 'PROCESSING',
      requested_at: new Date(),
    });

    // Mark bookings as being processed
    await (global as any).db.bookings.updateMany(
      { booking_id: { $in: booking_ids } },
      { payout_status: 'PROCESSING' },
    );

    // Initiate Xendit disbursement
    try {
      const disbursement = await XenditDisbursementService.createDisbursement({
        payout_id: payoutId,
        provider_id: providerId,
        amount: totalAmount,
        payment_method,
        account_details,
      });

      await (global as any).db.payouts.update(
        { payout_id: payoutId },
        {
          xendit_disbursement_id: disbursement.id,
          xendit_status: disbursement.status,
        },
      );
    } catch (xenditError: any) {
      console.error('Xendit disbursement failed:', xenditError);

      // Rollback
      await (global as any).db.payouts.update(
        { payout_id: payoutId },
        { status: 'FAILED', error_message: xenditError.message },
      );

      await (global as any).db.bookings.updateMany(
        { booking_id: { $in: booking_ids } },
        { payout_status: 'AVAILABLE' },
      );

      throw xenditError;
    }

    return res.json({
      success: true,
      data: {
        payout_id: payoutId,
        amount: totalAmount,
        booking_count: bookings.length,
        status: 'PROCESSING',
        estimated_completion: '1-2 business days',
      },
    });
  } catch (error) {
    console.error('Request payout error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process payout request',
    });
  }
}

async function getRecentPayouts(providerId: string, limit: number) {
  const payouts = await (global as any).db.payouts
    .find({
      provider_id: providerId,
      status: 'COMPLETED',
    })
    .sort({ paid_at: -1 })
    .limit(limit);

  return payouts.map((p: any) => ({
    payout_id: p.payout_id,
    booking_number: p.booking_number,
    amount: p.amount,
    paid_at: p.paid_at,
  }));
}

