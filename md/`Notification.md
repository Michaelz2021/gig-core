`Notification.md`에서 읽은 엔티티 정보를 바탕으로 SQL로 변환하면 다음과 같습니다.

```sql
-- ENUM 타입 정의
CREATE TYPE notification_type AS ENUM (
  'booking',
  'payment',
  'review',
  'message',
  'auction',
  'quote',
  'rfq',
  'system'
);

CREATE TYPE notification_priority AS ENUM (
  'low',
  'normal',
  'high',
  'urgent'
);

-- notifications 테이블
CREATE TABLE notifications (
  -- 기본 키
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 수신 유저
  user_id             UUID NOT NULL REFERENCES users(id),

  -- 알림 유형
  notification_type   notification_type NOT NULL,
  type                notification_type,                        -- 하위 호환성 유지

  -- 내용
  title               VARCHAR NOT NULL,
  message             TEXT NOT NULL,

  -- 관련 엔티티 링크
  action_url          VARCHAR,
  related_entity_type VARCHAR,
  related_entity_id   UUID,

  -- 우선순위
  priority            notification_priority NOT NULL DEFAULT 'normal',

  -- 읽음 상태
  is_read             BOOLEAN NOT NULL DEFAULT FALSE,
  read_at             TIMESTAMP,

  -- 전송 채널 플래그
  sent_via_push       BOOLEAN NOT NULL DEFAULT FALSE,
  sent_via_email      BOOLEAN NOT NULL DEFAULT FALSE,
  sent_via_sms        BOOLEAN NOT NULL DEFAULT FALSE,

  -- 만료 시간
  expires_at          TIMESTAMP,

  -- 확장 메타데이터
  metadata            JSONB,

  -- 생성 시간
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 인덱스 (조회 성능 최적화)
CREATE INDEX idx_notifications_user_id        ON notifications(user_id);
CREATE INDEX idx_notifications_type           ON notifications(notification_type);
CREATE INDEX idx_notifications_is_read        ON notifications(is_read);
CREATE INDEX idx_notifications_created_at     ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at     ON notifications(expires_at)
  WHERE expires_at IS NOT NULL;
CREATE INDEX idx_notifications_metadata       ON notifications USING GIN(metadata);
```

**포인트 정리:**

- `metadata` 컬럼은 `JSONB` 타입이라 GIN 인덱스를 걸어두면 JSON 내부 키 검색도 빠르게 처리됩니다.
- `user_id` + `is_read` 조합 인덱스를 추가하면 "내 미읽음 알림 조회" 쿼리 성능이 더 좋아집니다.
- `expires_at` 인덱스는 `WHERE expires_at IS NOT NULL` 조건을 붙여 NULL인 row는 인덱스에서 제외해 효율적으로 관리합니다.


