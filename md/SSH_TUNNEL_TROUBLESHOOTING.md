# SSH 터널 연결 문제 해결 가이드

## 문제: "Connect timed out" 오류

DBeaver에서 SSH 터널 연결 시 타임아웃이 발생하는 경우, 다음을 확인하세요.

## 0. 중요: 퍼블릭 IP vs 프라이빗 IP

**AWS EC2 인스턴스에는 두 가지 IP 주소가 있습니다:**

- **퍼블릭 IP**: 외부에서 접근할 때 사용 (예: `43.201.114.64`)
- **프라이빗 IP**: 내부 네트워크용 (예: `172.31.44.14`)

⚠️ **Mac에서 연결할 때는 퍼블릭 IP를 사용해야 합니다!**

서버의 퍼블릭 IP 확인:
```bash
# 서버에서 실행
curl http://169.254.169.254/latest/meta-data/public-ipv4
# 또는
curl http://checkip.amazonaws.com
```

또는 AWS 콘솔 → EC2 → 인스턴스 → 퍼블릭 IPv4 주소 확인

## 1. AWS 보안 그룹 확인 (가장 중요)

AWS EC2 인스턴스의 보안 그룹에서 SSH 포트(22)가 열려있는지 확인해야 합니다.

### AWS 콘솔에서 확인

1. **AWS 콘솔** → **EC2** → **인스턴스** 선택
2. 인스턴스 선택 → **보안** 탭 → **보안 그룹** 클릭
3. **인바운드 규칙** 확인:
   - **포트 22 (SSH)**가 열려있는지 확인
   - **소스**가 다음 중 하나인지 확인:
     - `내 IP` (권장)
     - `0.0.0.0/0` (모든 IP 허용 - 보안상 권장하지 않음)
     - 특정 IP 주소

### 보안 그룹 규칙 추가

포트 22가 없거나 Mac의 IP가 허용되지 않은 경우:

1. 보안 그룹 선택 → **인바운드 규칙 편집**
2. **규칙 추가** 클릭
3. 설정:
   - **유형**: SSH
   - **프로토콜**: TCP
   - **포트 범위**: 22
   - **소스**: 
     - **내 IP** 선택 (권장)
     - 또는 Mac의 공인 IP 주소 입력 (예: `123.45.67.89/32`)

### Mac의 공인 IP 확인

Mac 터미널에서:

```bash
curl ifconfig.me
# 또는
curl icanhazip.com
```

## 2. SSH 연결 직접 테스트

DBeaver를 사용하기 전에 Mac 터미널에서 SSH 연결을 직접 테스트하세요:

```bash
# SSH 키 파일 권한 확인 및 설정
chmod 400 ~/.ssh/your-key.pem

# SSH 연결 테스트 (퍼블릭 IP 사용!)
ssh -i ~/.ssh/your-key.pem ubuntu@[퍼블릭-IP-주소]

# 예시 (퍼블릭 IP가 43.201.114.64인 경우)
ssh -i ~/.ssh/your-key.pem ubuntu@43.201.114.64

# 또는 verbose 모드로 상세 정보 확인
ssh -v -i ~/.ssh/your-key.pem ubuntu@[퍼블릭-IP-주소]
```

**성공하면**: SSH 연결은 정상입니다. DBeaver 설정을 확인하세요.
**실패하면**: 보안 그룹 또는 네트워크 문제입니다.

## 3. DBeaver SSH 설정 확인

### SSH 키 파일 경로

DBeaver에서 SSH 키 파일 경로를 정확히 입력해야 합니다:

- **절대 경로 사용** (권장):
  ```
  /Users/your-username/.ssh/your-key.pem
  ```
- **또는 홈 디렉토리 사용**:
  ```
  ~/.ssh/your-key.pem
  ```

### SSH 키 파일 권한

Mac 터미널에서:

```bash
# 키 파일 권한 확인
ls -la ~/.ssh/your-key.pem

# 권한 설정 (필요한 경우)
chmod 600 ~/.ssh/your-key.pem
```

### DBeaver SSH 설정 체크리스트

**SSH 탭:**
- ✅ **Use SSH Tunnel**: 체크됨
- ✅ **Host**: `[퍼블릭-IP-주소]` (예: `43.201.114.64`) ⚠️ **프라이빗 IP가 아닌 퍼블릭 IP 사용!**
- ✅ **Port**: `22`
- ✅ **User Name**: `ubuntu` (또는 실제 SSH 사용자명)
- ✅ **Authentication Method**: `Public Key`
- ✅ **Key Path**: 키 파일의 **절대 경로** (예: `/Users/your-username/.ssh/your-key.pem`)
- ✅ **Passphrase**: 키에 passphrase가 있다면 입력

## 4. 대안: 직접 연결 (SSH 터널 없이)

보안 그룹에서 PostgreSQL 포트(5432)를 열고 직접 연결할 수도 있습니다:

### 보안 그룹에 포트 5432 추가

1. AWS 콘솔 → EC2 → 보안 그룹 → 인바운드 규칙 편집
2. 규칙 추가:
   - **유형**: PostgreSQL
   - **프로토콜**: TCP
   - **포트 범위**: 5432
   - **소스**: Mac의 IP 주소 (예: `123.45.67.89/32`)

### DBeaver에서 직접 연결

**Main 탭:**
- **Host**: `[퍼블릭-IP-주소]` (SSH 터널 사용 시 `localhost`, 직접 연결 시 퍼블릭 IP)
- **Port**: `5432`
- **Database**: `ai_trusttrade`
- **Username**: `trusttrade`
- **Password**: `secure_password_123`

**SSH 탭:**
- **Use SSH Tunnel**: 체크 해제

⚠️ **주의**: 직접 연결은 보안상 SSH 터널보다 덜 안전합니다. 개발 환경에서만 사용하세요.

## 5. 네트워크 문제 확인

### 방화벽 확인

Mac의 방화벽이 SSH 연결을 차단하지 않는지 확인:

```bash
# Mac 시스템 설정 → 보안 및 개인 정보 보호 → 방화벽
# 방화벽이 켜져 있다면 SSH를 허용해야 합니다
```

### VPN 확인

VPN을 사용 중이라면 VPN 연결을 끄고 다시 시도해보세요.

## 6. 서버 측 확인

서버에서 SSH 설정 확인:

```bash
# SSH 서비스 상태 확인
sudo systemctl status sshd

# SSH 포트 확인
sudo netstat -tlnp | grep :22

# SSH 설정 파일 확인
sudo cat /etc/ssh/sshd_config | grep -E "Port|PermitRootLogin|PasswordAuthentication"
```

## 7. 단계별 문제 해결 체크리스트

- [ ] AWS 보안 그룹에서 포트 22가 열려있는가?
- [ ] Mac의 IP 주소가 보안 그룹에 허용되어 있는가?
- [ ] Mac 터미널에서 SSH 연결이 되는가?
- [ ] SSH 키 파일 권한이 올바른가? (`chmod 600`)
- [ ] DBeaver에서 SSH 키 파일 경로가 정확한가?
- [ ] DBeaver에서 SSH 사용자명이 올바른가? (`ubuntu`)
- [ ] Mac 방화벽이 SSH를 차단하지 않는가?
- [ ] VPN을 사용 중인가? (있다면 끄고 시도)

## 8. 빠른 해결 방법

가장 빠른 해결책:

1. **서버의 퍼블릭 IP 확인**:
   - AWS 콘솔 → EC2 → 인스턴스 → 퍼블릭 IPv4 주소
   - 또는 서버에서: `curl http://169.254.169.254/latest/meta-data/public-ipv4`

2. **Mac 터미널에서 SSH 연결 테스트** (퍼블릭 IP 사용):
   ```bash
   ssh -i ~/.ssh/your-key.pem ubuntu@[퍼블릭-IP-주소]
   ```

2. **연결 실패 시**: AWS 콘솔에서 보안 그룹 확인 및 포트 22 추가

3. **연결 성공 시**: DBeaver 설정 확인
   - SSH 키 파일 경로를 절대 경로로 변경
   - SSH 사용자명 확인 (`ubuntu`)

## 9. 추가 도움말

문제가 계속되면 다음 정보를 확인하세요:

- Mac의 공인 IP 주소
- SSH 키 파일 경로
- AWS 보안 그룹 설정 스크린샷
- Mac 터미널에서 `ssh -v` 명령어 출력

---

**현재 서버 정보:**
- 프라이빗 IP: 172.31.44.14 (내부 네트워크용)
- 퍼블릭 IP: [AWS 콘솔에서 확인 필요] (외부 접근용) ⚠️ **Mac에서 연결 시 사용!**
- SSH 포트: 22
- SSH 사용자: ubuntu
- PostgreSQL 포트: 5432

