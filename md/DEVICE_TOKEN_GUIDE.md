# 디바이스 토큰 가이드

## 디바이스 토큰이란?

FCM (Firebase Cloud Messaging) 디바이스 토큰은 각 모바일 디바이스를 고유하게 식별하는 문자열입니다. 푸시 알림을 특정 디바이스에 전송하기 위해 필요합니다.

## 디바이스 토큰을 얻는 방법

### 1. 모바일 앱에서 (실제 사용)

#### Android (React Native / Flutter / Native)
```javascript
// React Native 예시
import messaging from '@react-native-firebase/messaging';

async function getDeviceToken() {
  const token = await messaging().getToken();
  console.log('FCM Token:', token);
  return token;
}

// 토큰이 갱신될 때마다 호출
messaging().onTokenRefresh(token => {
  console.log('New FCM Token:', token);
  // 서버에 새 토큰 등록
  registerTokenToServer(token);
});
```

#### iOS (React Native / Flutter / Native)
```swift
// Swift 예시
Messaging.messaging().token { token, error in
  if let error = error {
    print("Error fetching FCM registration token: \(error)")
  } else if let token = token {
    print("FCM registration token: \(token)")
    // 서버에 토큰 등록
    registerTokenToServer(token)
  }
}
```

### 2. 테스트용 방법

#### 방법 A: Firebase Console에서 테스트
1. Firebase Console 접속: https://console.firebase.google.com/
2. 프로젝트 선택 → Cloud Messaging
3. "Send test message" 클릭
4. "FCM registration token" 입력 필드에 토큰 입력 (앱에서 가져온 토큰)

#### 방법 B: 앱 로그에서 확인
앱을 실행하고 FCM 토큰이 로그에 출력되는지 확인:
```bash
# Android 로그 확인
adb logcat | grep -i "fcm\|firebase\|token"

# iOS 로그 확인 (Xcode Console)
```

#### 방법 C: 임시 테스트 토큰 생성
실제 앱이 없을 경우, Firebase Admin SDK로 테스트 토큰을 생성할 수 없습니다. 
**반드시 실제 모바일 앱에서 토큰을 가져와야 합니다.**

## 디바이스 토큰 등록 API

### 1. 토큰 등록
```bash
POST /api/v1/users/me/device-token
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "deviceToken": "your-fcm-device-token-here"
}
```

**cURL 예시:**
```bash
TOKEN="your_jwt_token_here"
DEVICE_TOKEN="your_fcm_device_token_here"

curl -X POST http://43.201.114.64:3000/api/v1/users/me/device-token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"deviceToken\": \"$DEVICE_TOKEN\"
  }"
```

### 2. 등록된 토큰 조회
```bash
GET /api/v1/users/me/device-tokens
Authorization: Bearer YOUR_JWT_TOKEN
```

**응답:**
```json
{
  "deviceTokens": [
    "token1",
    "token2"
  ]
}
```

### 3. 토큰 제거
```bash
DELETE /api/v1/users/me/device-token/{deviceToken}
Authorization: Bearer YOUR_JWT_TOKEN
```

## 전체 워크플로우

### 1. 앱 시작 시
```
앱 실행
  ↓
FCM 토큰 요청
  ↓
토큰 받기
  ↓
POST /api/v1/users/me/device-token 으로 서버에 등록
```

### 2. 토큰 갱신 시
```
FCM 토큰 갱신 이벤트 발생
  ↓
새 토큰 받기
  ↓
POST /api/v1/users/me/device-token 으로 서버에 업데이트
  ↓
기존 토큰은 자동으로 중복 제거됨
```

### 3. 푸시 알림 전송 시
```
서버에서 사용자의 deviceTokens 조회
  ↓
FCM 서비스를 통해 푸시 알림 전송
  ↓
성공/실패 결과 반환
```

## 실제 사용 예시

### React Native 앱에서:
```javascript
import messaging from '@react-native-firebase/messaging';
import { API_BASE_URL } from './config';

async function registerDeviceToken(userToken) {
  try {
    // FCM 토큰 가져오기
    const fcmToken = await messaging().getToken();
    console.log('FCM Token:', fcmToken);
    
    // 서버에 등록
    const response = await fetch(`${API_BASE_URL}/users/me/device-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        deviceToken: fcmToken,
      }),
    });
    
    const result = await response.json();
    console.log('Token registered:', result);
    
    // 토큰 갱신 리스너
    messaging().onTokenRefresh(async (newToken) => {
      console.log('Token refreshed:', newToken);
      await registerDeviceToken(userToken);
    });
    
  } catch (error) {
    console.error('Failed to register device token:', error);
  }
}
```

## 주의사항

1. **토큰은 디바이스마다 고유합니다**
   - 같은 사용자가 여러 디바이스를 사용할 수 있으므로 배열로 저장됩니다

2. **토큰은 변경될 수 있습니다**
   - 앱 재설치, 앱 데이터 삭제, 토큰 갱신 시 변경됩니다
   - `onTokenRefresh` 이벤트를 항상 리스닝해야 합니다

3. **토큰은 만료될 수 있습니다**
   - 오래된 토큰은 FCM 전송 시 에러가 발생합니다
   - 에러 발생 시 해당 토큰을 제거해야 합니다

4. **프로덕션 환경에서는**
   - 토큰을 안전하게 저장하고 전송해야 합니다
   - HTTPS를 사용하여 토큰을 전송하세요

## 문제 해결

### 토큰을 찾을 수 없어요
- 앱에서 FCM이 제대로 초기화되었는지 확인
- Firebase 프로젝트 설정이 올바른지 확인
- 앱의 `google-services.json` (Android) 또는 `GoogleService-Info.plist` (iOS) 파일 확인

### 토큰 등록은 되는데 알림이 안 와요
- Firebase 환경 변수가 올바르게 설정되었는지 확인
- 서버 로그에서 FCM 전송 결과 확인
- 디바이스의 알림 권한이 허용되었는지 확인

### 토큰이 계속 변경돼요
- 정상적인 동작입니다
- `onTokenRefresh` 이벤트를 처리하여 자동으로 업데이트하세요

