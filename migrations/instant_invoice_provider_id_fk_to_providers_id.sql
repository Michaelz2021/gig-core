-- instant_invoice.provider_id FK 제거. 참조 무결성 검사 없이 UUID만 저장.
-- (FK가 있으면 providers 테이블에 해당 id가 없을 때 insert 500 에러 발생)

ALTER TABLE instant_invoice
  DROP CONSTRAINT IF EXISTS instant_invoice_provider_id_fkey;
