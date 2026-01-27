# SSH 연결 타임아웃 빠른 해결 가이드

## ⚠️ 가장 중요한 확인사항

**Mac에서 AWS EC2 서버에 연결할 때는 퍼블릭 IP를 사용해야 합니다!**

- ❌ 프라이빗 IP (`172.31.44.14`) - 내부 네트워크용
- ✅ 퍼블릭 IP (`43.201.114.64` 같은 주소) - 외부 접근용

## 1단계: 퍼블릭 IP 확인

### 방법 A: AWS 콘솔에서 확인 (가장 확실)

1. AWS 콘솔 → EC2 → 인스턴스
2. 인스턴스 선택
3. **퍼블릭 IPv4 주소** 확인 (예: `43.201.114.64`)

### 방법 B: 서버에서 확인

```bash
curl http://169.254.169.254/latest/meta-data/public-ipv4
```

## 2단계: Mac 터미널에서 SSH 연결 테스트

퍼블릭 IP를 사용하여 연결 테스트:

```bash
# SSH 키 파일 권한 설정
chmod 600 ~/.ssh/your-key.pem

# SSH 연결 테스트 (퍼블릭 IP 사용!)
ssh -i ~/.ssh/your-key.pem ubuntu@[퍼블릭-IP-주소]

# 예시
ssh -i ~/.ssh/your-key.pem ubuntu@43.201.114.64
```

**성공하면**: DBeaver 설정 문제입니다. 3단계로 진행하세요.
**실패하면**: AWS 보안 그룹 설정 문제입니다. 4단계로 진행하세요.

## 3단계: DBeaver SSH 설정 수정

DBeaver에서 SSH 터널 설정:

**SSH 탭:**
- **Host**: `[퍼블릭-IP-주소]` ⚠️ **프라이빗 IP가 아닌 퍼블릭 IP!**
- **Port**: `22`
- **User Name**: `ubuntu`
- **Authentication Method**: `Public Key`
- **Key Path**: `/Users/your-username/.ssh/your-key.pem` (절대 경로 사용)

**Main 탭:**
- **Host**: `localhost` (SSH 터널 사용 시)
- **Port**: `5432`
- **Database**: `ai_trusttrade`
- **Username**: `trusttrade`
- **Password**: `secure_password_123`

## 4단계: AWS 보안 그룹 설정

SSH 연결이 실패하는 경우:

1. **AWS 콘솔** → **EC2** → **인스턴스** → **보안** 탭
2. **보안 그룹** 클릭
3. **인바운드 규칙** → **규칙 편집**
4. **규칙 추가**:
   - **유형**: SSH
   - **프로토콜**: TCP
   - **포트 범위**: 22
   - **소스**: 
     - **내 IP** 선택 (권장)
     - 또는 Mac의 공인 IP 입력

### Mac의 공인 IP 확인

Mac 터미널에서:

```bash
curl ifconfig.me
```

## 5단계: 연결 재시도

1. DBeaver에서 연결 삭제 후 재생성
2. 퍼블릭 IP 사용 확인
3. SSH 키 파일 경로 확인 (절대 경로)
4. **Test Connection** 클릭

## 체크리스트

- [ ] 퍼블릭 IP 주소 확인 (AWS 콘솔)
- [ ] Mac 터미널에서 SSH 연결 성공
- [ ] AWS 보안 그룹에서 포트 22 허용
- [ ] DBeaver에서 퍼블릭 IP 사용
- [ ] SSH 키 파일 경로가 절대 경로
- [ ] SSH 사용자명이 `ubuntu`

## 문제가 계속되면

자세한 문제 해결 가이드: `md/SSH_TUNNEL_TROUBLESHOOTING.md`

---

**요약:**
- Mac에서 연결 시 **퍼블릭 IP** 사용 필수
- AWS 보안 그룹에서 포트 22 허용 확인
- SSH 키 파일 권한: `chmod 600`
- DBeaver에서 SSH 키 파일 경로는 절대 경로 사용

