-- Instant order 결제 세션 구분용 컬럼
-- 정식 오더: NULL, Instant 오더: instant_bookings.id (UUID)
ALTER TABLE payment_sessions
  ADD COLUMN IF NOT EXISTS instant_booking_id UUID NULL;

COMMENT ON COLUMN payment_sessions.instant_booking_id IS 'Instant order인 경우 instant_bookings.id; 정식 오더는 NULL';
