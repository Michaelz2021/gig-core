# pgAdmin 4 - config_local.py
# 서브경로(/pgadmin4/) 배포 시 세션 쿠키가 해당 경로로만 전송되도록 설정.
# 이 설정이 없으면 로그인 후 /browser/, /misc/ 등 요청에 쿠키가 안 붙어 401 발생.
COOKIE_DEFAULT_PATH = '/pgadmin4/'
