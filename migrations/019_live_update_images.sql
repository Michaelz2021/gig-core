-- Live Updates 이미지 저장 (booking별 다수 이미지)
-- work_progress_reports 와 별도로 클라이언트 Live Updates용 이미지 URL 보관
CREATE TABLE IF NOT EXISTS live_update_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_live_update_images_booking_id ON live_update_images(booking_id);
CREATE INDEX IF NOT EXISTS idx_live_update_images_created_at ON live_update_images(created_at DESC);

COMMENT ON TABLE live_update_images IS 'Live Updates 이미지 URL (booking 단위)';
COMMENT ON COLUMN live_update_images.booking_id IS 'bookings.id';
COMMENT ON COLUMN live_update_images.image_url IS '이미지 공개 URL (S3 등)';
