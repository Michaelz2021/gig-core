import { Controller, Get, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';

/**
 * 이메일 인증 링크 클릭 시 브라우저가 GET /verify-email?token=... 로 요청하는 경우 처리.
 * (전역 prefix 제외 경로로 등록됨) — 인증 없이 접근 가능.
 */
@Public()
@Controller('verify-email')
export class VerifyEmailViewController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get()
  async handleGet(
    @Query('token') token: string | undefined,
    @Res() res: Response,
  ) {
    // 이메일 인증은 이 컨트롤러에서 내부적으로 처리하고,
    // 최종 결과 화면은 같은 백엔드의 /verify-email-result 에서 간단한 HTML로 렌더링한다.
    // (상대 경로로 redirect 하므로 IP/도메인 상관 없이 동작)
    if (!token || typeof token !== 'string') {
      res.redirect(302, `/verify-email-result?error=missing_token`);
      return;
    }

    try {
      const result = await this.authService.verifyEmail(token);
      res.redirect(302, `/verify-email-result?verified=success&email=${encodeURIComponent(result.email)}`);
      return;
    } catch {
      res.redirect(302, `/verify-email-result?error=invalid_or_expired`);
      return;
    }
  }
}
