-- 인보이스 출력용 표시명 및 서비스 주소 옵션
ALTER TABLE instant_invoice
  ADD COLUMN IF NOT EXISTS listing_name VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS consumer_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS provider_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS service_address_option VARCHAR(20) NULL;

COMMENT ON COLUMN instant_invoice.listing_name IS '서비스 리스팅명 (출력용)';
COMMENT ON COLUMN instant_invoice.consumer_name IS '주문자(소비자) 표시명';
COMMENT ON COLUMN instant_invoice.provider_name IS '프로바이더 표시명';
COMMENT ON COLUMN instant_invoice.service_address_option IS '서비스 장소 옵션: Home | On Site';
