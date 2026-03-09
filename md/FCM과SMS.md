
현재 SMS 전송이 일어나는 경우
SMS는 SmsService.sendOTP() 한 경로로만 사용되고 있고, OTP(일회용 비밀번호) 전송에만 쓰입니다.
비즈니스 알림(예약, 결제, 공지 등)은 SMS로 보내지 않고, FCM 푸시만 사용합니다.

1. 회원가입 시 (Register)
경로: POST /auth/register → AuthService.register()
조건: 가입 시 phone(필리핀 번호)을 넣은 경우
동작: 가입 처리 후 해당 번호로 OTP SMS 발송.
Redis에 otp:{phone} 저장(5분). 이후 POST /auth/verify-otp 등으로 OTP 검증해 전화 인증 처리.


2. OTP 요청 (로그인 사용자)
경로: GET /auth/request-otp (JWT 필요) → AuthService.requestOtp(userId)
조건: JWT 사용자의 DB 등록 전화번호가 있고, 필리핀 모바일 형식이어야 함
동작: 해당 번호로 OTP SMS 발송. Redis에 저장 후 POST /auth/verify-otp로 검증.


3. 비밀번호 찾기 – 전화번호로 OTP
경로: POST /auth/forgot-otp (Public) → AuthService.forgotOtp(dto)
body에 otpType: 'phone', phone: '09...' 등
조건: otpType === 'phone' 이고, 입력한 전화번호로 가입된 사용자가 있을 때
동작: 해당 번호로 OTP SMS 발송. Redis에 forgot_otp:phone:{phone} 저장.
이후 updatePassword 등에서 OTP 검증 후 비밀번호 변경.

4. 테스트용 OTP 발송
경로: POST /auth/test-send-otp (JWT 필요) → AuthService.sendTestOtp(phone)
동작: 지정한 필리핀 번호로 테스트 OTP SMS 한 번 발송.
개발 환경에서는 응답에 OTP 값이 포함될 수 있음.


SMS가 나가지 않는 것
경매/견적/예약/결제/공지 등 비즈니스 알림
→ NotificationsService.send()는 DB 저장 + FCM 푸시만 하고, SMS 발송 로직 없음.

알림 엔티티의 sent_via_sms
→ DB 플래그만 있고, 실제로 SMS를 보내는 코드는 없음.


기술 스택
SMS 발송: auth/sms.service.ts → Semaphore API (https://api.semaphore.co/api/v4/otp)
설정: SEMAPHORE_API_KEY (없으면 SMS 실패, 개발 시 로그만 남기고 성공 처리 가능)
번호 형식: 필리핀 모바일 (PhoneValidator.isValidPhilippineMobile), Semaphore용으로 정규화 후 전송
요약: 현재 SMS는 가입 시 전화 인증 OTP, 로그인 사용자 OTP 요청, 비밀번호 찾기(전화번호) OTP, 테스트 OTP 이 네 가지 경우에만 전송됩니다.