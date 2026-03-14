# www.gigmarket.ph TLS 인증서 정상화 (Nginx)

8080을 쓰는 Nginx 서버에서 **https://www.gigmarket.ph** TLS를 정상화하는 방법입니다.

---

## 1. 목표

- **신뢰할 수 있는 CA**에서 발급한 인증서 사용 (예: Let's Encrypt)
- **전체 체인** 사용: 도메인 인증서 + 중간 인증서 (`fullchain.pem`)
- 도메인 일치, 만료 전

---

## 2. 서버에서 할 작업 (요약)

| 단계 | 내용 |
|------|------|
| 1 | 인증서 발급 (Let's Encrypt 권장) |
| 2 | Nginx에 **fullchain** + **privkey** 지정 |
| 3 | 443 리스닝 + 기존 8080 유지 |
| 4 | 재시작 후 검증 |

---

## 3. ACME challenge (필수) — 404 해결

**certbot --webroot** 는 `-w` 경로 아래에 `/.well-known/acme-challenge/토큰` 파일을 만들고, Let's Encrypt가 **http://www.gigmarket.ph/.well-known/acme-challenge/토큰** (기본 **80 포트**)으로 접근해 검증합니다.  
이때 **80 포트**에서 응답하는 `server` 블록이 **같은 webroot**로 `/.well-known/acme-challenge/` 를 서빙해야 합니다. 그렇지 않으면 **404** 또는 연결 실패로 갱신/발급이 실패합니다.

### 80 포트가 없을 때 (지금처럼 8080만 있을 때)

지금처럼 **listen 80** 이 없고 **8080(또는 443)만** 있다면, Let's Encrypt가 80으로 접속할 수 없어 인증이 실패합니다.  
**80 포트 전용 server 블록을 새로 추가**해야 합니다.

1. 아래 **「80 전용 설정 파일 추가」** 내용으로 새 파일을 만들고 활성화합니다.
2. `root` 경로는 실제 프론트가 서빙되는 디렉터리와 맞추거나, certbot `-w` 와 동일하게 둡니다 (갱신 시 certbot이 그 경로에 파일을 씁니다).
3. Nginx 재로드 후 certbot을 다시 실행합니다.

**80 전용 설정 파일 추가 (새 파일 한 개로 처리):**

```bash
# 프로젝트 예시를 복사
sudo cp /var/www/gig-core/docker/nginx-gigmarket-http-acme.conf.example /etc/nginx/sites-available/gigmarket-acme-80
sudo ln -sf /etc/nginx/sites-available/gigmarket-acme-80 /etc/nginx/sites-enabled/
# root 경로 확인 후 필요하면 수정 (아래 참고)
sudo nginx -t && sudo systemctl reload nginx
```

- **root** 는 반드시 **certbot -w** 와 같은 경로로 맞추세요.  
  - 예: 프론트가 `/var/www/html` 이면 `root /var/www/html;` 그리고 `certbot ... -w /var/www/html`  
  - 다른 경로(예: `/var/www/gig-front`)면 그에 맞게 수정 후 `certbot -w /var/www/...` 도 동일하게.
- 기존에 **server_name** 에 `www.gigmarket.ph` 가 없었다면, 위 예시에는 `www.gigmarket.ph gigmarket.ph` 가 모두 들어 있으므로 80으로 두 도메인 모두 처리됩니다.

이후 갱신:

```bash
sudo certbot certonly --webroot -w /var/www/html -d gigmarket.ph -d www.gigmarket.ph
```

(실제 webroot가 다르면 `-w` 를 위에서 쓴 `root` 와 동일하게.)

---

### 방법 B: 이미 80 포트 server 블록이 있을 때

**80 포트**를 쓰는 server가 이미 있고, 그 블록이 gigmarket.ph / www.gigmarket.ph 를 담당한다면, 그 블록 안에만 `location ^~ /.well-known/acme-challenge/` 와 `root` 를 넣으면 됩니다.

#### 80 포트 server 블록 찾기

서버(EC2)에서 아래 명령으로 **어느 파일의 어떤 server 블록**이 80 포트·gigmarket 도메인을 담당하는지 확인할 수 있습니다.

```bash
# 1) gigmarket / www.gigmarket.ph 가 포함된 설정 파일 찾기
sudo grep -r "gigmarket\|server_name" /etc/nginx/ 2>/dev/null | grep -v "\.default"

# 2) listen 80 인 server 블록이 있는 파일만
sudo grep -l "listen 80" /etc/nginx/sites-enabled/* /etc/nginx/conf.d/* 2>/dev/null

# 3) server_name에 gigmarket 포함된 줄 + 파일 경로
sudo grep -rn "server_name" /etc/nginx/ | grep -i gigmarket

# 4) Nginx가 실제로 읽는 설정만 (sites-enabled + conf.d)
ls -la /etc/nginx/sites-enabled/
cat /etc/nginx/nginx.conf | grep -E "include|sites-enabled|conf.d"
```

- **2)** 로 80을 쓰는 파일 목록을 보고, **3)** 으로 그 중에서 `server_name`에 `gigmarket` 이 들어 있는 **파일 경로**와 **줄 번호**를 확인합니다.
- 해당 파일을 연 뒤, `listen 80` 이 있고 `server_name ... gigmarket.ph ...` 인 `server { ... }` 블록이 **방법 B에서 수정할 블록**입니다. 그 블록 안에 `root`와 `location ^~ /.well-known/acme-challenge/` 를 넣으면 됩니다.

```nginx
# HTTP (80) - gigmarket.ph / www.gigmarket.ph (인증서 검증용)
server {
    listen 80;
    server_name www.gigmarket.ph gigmarket.ph;

    # certbot webroot와 동일한 경로 (certbot -w /var/www/html 와 일치)
    root /var/www/html;

    # Let's Encrypt ACME challenge — 이게 없으면 404로 갱신 실패
    location ^~ /.well-known/acme-challenge/ {
        default_type "text/plain";
        allow all;
    }

    # 나머지는 기존대로 (또는 HTTPS로 리다이렉트)
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

- **root** 를 certbot `-w` 와 동일하게 (예: `/var/www/html`) 맞추세요.  
- 수정 후 `sudo nginx -t && sudo systemctl reload nginx` 하고 다시 certbot 실행.

---

## 4. 인증서 발급 (Let's Encrypt 예시)

서버(EC2)에 SSH 접속 후:

```bash
# certbot 설치 (Ubuntu/Debian)
sudo apt update
sudo apt install -y certbot

# -w 경로를 위 Nginx root와 동일하게 (예: /var/www/html)
sudo certbot certonly --webroot -w /var/www/html -d gigmarket.ph -d www.gigmarket.ph
```

또는 Nginx를 잠시 멈추고 standalone으로:

```bash
sudo systemctl stop nginx
sudo certbot certonly --standalone -d gigmarket.ph -d www.gigmarket.ph
sudo systemctl start nginx
```

발급되면 다음 경로에 생성됩니다.

- **전체 체인 (도메인 + 중간)**: `/etc/letsencrypt/live/www.gigmarket.ph/fullchain.pem`
- **비밀키**: `/etc/letsencrypt/live/www.gigmarket.ph/privkey.pem`

반드시 **fullchain.pem**을 사용해야 중간 인증서가 포함됩니다.

---

## 5. Nginx 설정 (443 HTTPS)

기존 8080 설정은 그대로 두고, **443 HTTPS**용 `server` 블록을 추가합니다.

설정 파일 위치 예: `/etc/nginx/sites-available/gigmarket-ssl`  
(또는 기존 8080 설정이 있는 파일에 아래 `server { }` 블록을 추가)

```nginx
# HTTPS - www.gigmarket.ph (체인 완전: fullchain.pem 사용)
server {
    listen 443 ssl http2;
    server_name www.gigmarket.ph gigmarket.ph;

    # 체인 완전: 도메인 + 중간 인증서 (필수)
    ssl_certificate     /etc/letsencrypt/live/www.gigmarket.ph/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/www.gigmarket.ph/privkey.pem;

    # 권장 SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # 기존 8080에서 서빙하던 프론트/API 프록시
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # API 백엔드가 같은 서버 3000이면 예시
    location /api/ {
        proxy_pass http://127.0.0.1:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

- **8080만 쓰는 기존 server 블록**은 그대로 두고, 위처럼 **443**용 블록만 추가하면 됩니다.
- `root` / `location /api/` 는 실제 경로·백엔드 포트에 맞게 수정하세요.

---

## 6. 설정 적용

```bash
# 문법 검사
sudo nginx -t

# 재로드
sudo systemctl reload nginx
```

---

## 7. 검증

- 브라우저: `https://www.gigmarket.ph` → 자물채 정상, 인증서 정보에서 “발급자”와 체인 확인.
- 터미널:
  ```bash
  openssl s_client -connect www.gigmarket.ph:443 -servername www.gigmarket.ph
  ```
  - “Verify return code: 0 (ok)” 이면 정상.

---

## 8. 갱신 (Let's Encrypt)

90일마다 갱신 후 Nginx 재로드:

```bash
sudo certbot renew
sudo systemctl reload nginx
```

cron 예시: `0 3 * * * certbot renew --quiet && systemctl reload nginx`

---

## 9. 프로젝트에 포함된 예시 파일

- **예시 전용 Nginx 설정**: `docker/nginx-gigmarket-ssl.conf.example`  
  위 내용을 복사해 두었습니다. 서버의 `/etc/nginx/sites-available/` 등에 복사한 뒤 경로만 수정해 사용하면 됩니다.

이렇게 하면 **https://www.gigmarket.ph** 의 TLS가 정상화되고, 앱 코드 변경 없이 실기기에서도 로그인 등이 동작할 수 있습니다.
