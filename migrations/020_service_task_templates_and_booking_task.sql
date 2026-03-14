-- ============================================================
-- 1) service_task_templates 마스터 테이블
-- ============================================================
CREATE TABLE IF NOT EXISTS service_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type VARCHAR(20) NOT NULL,
  phase INT NOT NULL,
  task_seq INT NOT NULL,
  task_code VARCHAR(50) NOT NULL,
  task_label TEXT NOT NULL,
  actor VARCHAR(20) NOT NULL,
  is_auto BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

CREATE INDEX IF NOT EXISTS idx_service_task_templates_service_type ON service_task_templates(service_type);
CREATE UNIQUE INDEX IF NOT EXISTS uq_service_task_templates_type_phase_seq ON service_task_templates(service_type, phase, task_seq);

COMMENT ON TABLE service_task_templates IS 'Service type별 작업 단계 템플릿 (HOME, EVENTS, FREELANCE, PERSONAL)';

-- ============================================================
-- 2) Seed: HOME / PERSONAL SERVICES
-- ============================================================
INSERT INTO service_task_templates (service_type, phase, task_seq, task_code, task_label, actor, is_auto)
VALUES
  ('HOME', 4, 1, 'PROVIDER_DEPART',     'Provider confirmed departure to job site',          'PROVIDER', false),
  ('HOME', 4, 2, 'ARRIVE_PHOTO',        'Provider uploaded arrival photo at job site',        'PROVIDER', false),
  ('HOME', 4, 3, 'WORK_START_CONFIRM',  'Both parties confirmed work has started',            'BOTH',     false),
  ('HOME', 4, 4, 'WORK_DONE_PHOTO',     'Provider uploaded work completion photo',            'PROVIDER', false),
  ('HOME', 5, 1, 'CONSUMER_APPROVE',    'Consumer approved completion (auto in 48h)',         'CONSUMER', true),
  ('HOME', 5, 2, 'PAYMENT_RELEASE',     'Payment released and review requested',              'SYSTEM',   true)
ON CONFLICT (service_type, phase, task_seq) DO NOTHING;

-- ============================================================
-- 3) Seed: EVENTS SERVICES
-- ============================================================
INSERT INTO service_task_templates (service_type, phase, task_seq, task_code, task_label, actor, is_auto)
VALUES
  ('EVENTS', 4, 1, 'PRE_BRIEF_DONE',    'Pre-event briefing completed by both parties',      'BOTH',     false),
  ('EVENTS', 4, 2, 'DDAY_CHECKIN',     'Provider checked in on event day',                  'PROVIDER', false),
  ('EVENTS', 4, 3, 'EVENT_STARTED',     'Event start confirmed by both parties',             'BOTH',     false),
  ('EVENTS', 4, 4, 'EVENT_ENDED',       'Event end confirmed by both parties',               'BOTH',     false),
  ('EVENTS', 5, 1, 'DELIVERABLE_SENT',  'Provider submitted deliverables (photos/videos)',   'PROVIDER', false),
  ('EVENTS', 5, 2, 'CONSUMER_APPROVE',  'Consumer approved deliverables (auto in 48h)',      'CONSUMER', true),
  ('EVENTS', 5, 3, 'PAYMENT_RELEASE',   'Payment released and review requested',             'SYSTEM',   true)
ON CONFLICT (service_type, phase, task_seq) DO NOTHING;

-- ============================================================
-- 4) Seed: FREELANCE / DIGITAL SERVICES
-- ============================================================
INSERT INTO service_task_templates (service_type, phase, task_seq, task_code, task_label, actor, is_auto)
VALUES
  ('FREELANCE', 4, 1, 'WORK_STARTED',      'Provider confirmed work has started',               'PROVIDER', false),
  ('FREELANCE', 4, 2, 'DRAFT_SUBMITTED',   'Provider submitted draft / initial deliverable',    'PROVIDER', false),
  ('FREELANCE', 4, 3, 'DRAFT_REVIEWED',    'Consumer reviewed draft and provided feedback',     'CONSUMER', false),
  ('FREELANCE', 4, 4, 'FINAL_SUBMITTED',   'Provider submitted final deliverable',              'PROVIDER', false),
  ('FREELANCE', 5, 1, 'REVISION_OR_PASS',  'Consumer requested revision or approved final',     'CONSUMER', false),
  ('FREELANCE', 5, 2, 'CONSUMER_APPROVE',  'Consumer gave final approval (auto in 48h)',        'CONSUMER', true),
  ('FREELANCE', 5, 3, 'PAYMENT_RELEASE',   'Payment released and review requested',             'SYSTEM',   true)
ON CONFLICT (service_type, phase, task_seq) DO NOTHING;

-- ============================================================
-- 5) Seed: PERSONAL SERVICES (on-site, single session)
-- ============================================================
INSERT INTO service_task_templates (service_type, phase, task_seq, task_code, task_label, actor, is_auto)
VALUES
  ('PERSONAL', 4, 1, 'APPOINTMENT_CONFIRMED', 'Appointment date and time confirmed',               'BOTH',     false),
  ('PERSONAL', 4, 2, 'PROVIDER_ARRIVED',     'Provider arrived at agreed location',              'PROVIDER', false),
  ('PERSONAL', 4, 3, 'SESSION_STARTED',      'Session started and confirmed by consumer',        'BOTH',     false),
  ('PERSONAL', 4, 4, 'SESSION_COMPLETED',    'Provider marked session as completed',             'PROVIDER', false),
  ('PERSONAL', 5, 1, 'CONSUMER_APPROVE',     'Consumer approved service completion (auto 48h)',  'CONSUMER', true),
  ('PERSONAL', 5, 2, 'PAYMENT_RELEASE',      'Payment released and review requested',             'SYSTEM',   true)
ON CONFLICT (service_type, phase, task_seq) DO NOTHING;

-- ============================================================
-- 6) service_categories에 service_type 추가 (HOME|EVENTS|FREELANCE|PERSONAL)
-- ============================================================
ALTER TABLE service_categories
  ADD COLUMN IF NOT EXISTS service_type VARCHAR(20) NULL;
COMMENT ON COLUMN service_categories.service_type IS 'Template용: HOME, EVENTS, FREELANCE, PERSONAL. NULL이면 예약 생성 시 HOME 사용';

-- ============================================================
-- 7) bookings.task 를 JSONB로 변경 (단계별 완료 추적용 배열)
-- ============================================================
ALTER TABLE bookings
  ALTER COLUMN task TYPE JSONB USING (
    CASE
      WHEN task IS NULL OR trim(task::text) = '' THEN '[]'::jsonb
      ELSE jsonb_build_array(jsonb_build_object('legacy', true, 'text', task))
    END
  );
COMMENT ON COLUMN bookings.task IS 'Service task template 기반 단계 배열. [{ templateId, taskCode, taskLabel, phase, taskSeq, actor, isAuto, completed, completedAt }, ...]';
</think>
INSERT에 ON CONFLICT를 적용하려면 유니크 제약이 필요합니다. 수정 중입니다.
<｜tool▁calls▁begin｜><｜tool▁call▁begin｜>
StrReplace