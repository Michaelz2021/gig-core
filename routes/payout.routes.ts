// routes/payout.routes.ts

import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as payoutController from '../controllers/payout.controller';

const router = Router();

/**
 * GET /api/v1/payout/summary
 * Get provider's payout summary
 */
router.get('/summary', authenticate, payoutController.getPayoutSummary);

/**
 * GET /api/v1/payout/available
 * Get list of available payouts (completed bookings ready for disbursement)
 */
router.get('/available', authenticate, payoutController.getAvailablePayouts);

/**
 * GET /api/v1/payout/history
 * Get payout history (completed disbursements)
 */
router.get('/history', authenticate, payoutController.getPayoutHistory);

/**
 * POST /api/v1/payout/request
 * Request payout for selected bookings
 */
router.post('/request', authenticate, payoutController.requestPayout);

/**
 * GET /api/v1/payout/:payoutId
 * Get specific payout details
 */
router.get('/:payoutId', authenticate, payoutController.getPayoutDetails as any);

export default router;

