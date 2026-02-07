import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 이메일 인증 결과를 간단한 HTML 페이지로 보여주는 뷰 컨트롤러.
 * 백엔드에서 직접 렌더링하므로 JSON 404 에러 대신 사람 눈에 보이는 화면이 출력된다.
 */
@Public()
@Controller('verify-email-result')
export class VerifyEmailResultViewController {
  @Get()
  renderResult(
    @Query('verified') verified: string | undefined,
    @Query('email') email: string | undefined,
    @Query('error') error: string | undefined,
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8');

    // 성공 케이스
    if (verified === 'success') {
      res.send(`
        <!DOCTYPE html>
        <html lang="ko">
          <head>
            <meta charset="utf-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1" />
            <title>이메일 인증 완료</title>
            <style>
              body { font-family: -apple-system,BlinkMacSystemFont,system-ui,sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
              .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); padding: 28px 24px 24px; }
              .title { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #111827; }
              .subtitle { font-size: 14px; color: #6b7280; margin-bottom: 20px; }
              .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #ecfdf5; color: #166534; margin-bottom: 10px; }
              .badge-icon { width: 16px; height: 16px; border-radius: 999px; background: #22c55e; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 12px; margin-right: 6px; }
              .email { font-weight: 600; color: #111827; word-break: break-all; }
              .button { display: inline-flex; align-items: center; justify-content: center; margin-top: 20px; padding: 10px 18px; border-radius: 999px; border: none; background: #22c55e; color: white; font-weight: 600; font-size: 14px; cursor: pointer; text-decoration: none; }
              .button:hover { background: #16a34a; }
              .hint { margin-top: 16px; font-size: 12px; color: #9ca3af; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="badge">
                <span class="badge-icon">✓</span>
                이메일 인증 완료
              </div>
              <div class="title">계정 이메일이 인증되었습니다.</div>
              <div class="subtitle">
                ${email ? `<span class="email">${email}</span> 로 전송된 인증 메일을 확인했습니다.` : '이메일 인증이 성공적으로 처리되었습니다.'}
              </div>
              <a class="button" href="/">
                앱으로 돌아가기
              </a>
              <div class="hint">
                이 창을 닫고 앱(또는 웹사이트)에서 다시 로그인해 주세요.
              </div>
            </div>
          </body>
        </html>
      `);
      return;
    }

    // 실패 / 에러 케이스
    const errorMessage =
      error === 'missing_token'
        ? '인증 토큰이 없습니다. 이메일 링크가 올바른지 확인해 주세요.'
        : '인증 링크가 만료되었거나 유효하지 않습니다. 다시 시도해 주세요.';

    res.send(`
      <!DOCTYPE html>
      <html lang="ko">
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>이메일 인증 실패</title>
          <style>
            body { font-family: -apple-system,BlinkMacSystemFont,system-ui,sans-serif; margin: 0; padding: 0; background: #f5f5f5; color: #333; }
            .container { max-width: 480px; margin: 40px auto; background: #ffffff; border-radius: 12px; box-shadow: 0 10px 30px rgba(0,0,0,0.08); padding: 28px 24px 24px; }
            .badge { display: inline-flex; align-items: center; padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; background: #fef2f2; color: #b91c1c; margin-bottom: 10px; }
            .badge-icon { width: 16px; height: 16px; border-radius: 999px; background: #ef4444; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 12px; margin-right: 6px; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #111827; }
            .message { font-size: 14px; color: #6b7280; margin-bottom: 16px; }
            .hint { font-size: 12px; color: #9ca3af; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="badge">
              <span class="badge-icon">!</span>
              이메일 인증 실패
            </div>
            <div class="title">이메일을 인증하지 못했습니다.</div>
            <div class="message">${errorMessage}</div>
            <div class="hint">
              인증 메일을 다시 받고 싶다면 앱 또는 웹사이트에서 회원가입/로그인 과정을 다시 진행해 주세요.
            </div>
          </div>
        </body>
      </html>
    `);
  }
}

