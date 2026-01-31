import { Injectable, ExecutionContext, UnauthorizedException, Optional } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { Inject } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Optional() @Inject('REDIS_CLIENT') private readonly redisClient: any,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Check if token is blacklisted (skip on Redis error so valid tokens still work)
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers?.authorization;

    if (authHeader && this.redisClient) {
      try {
        const token = authHeader.replace(/^Bearer\s+/i, '').trim();
        const blacklistedKey = `blacklist:access:${token}`;
        const isBlacklisted = await this.redisClient.get(blacklistedKey);
        if (isBlacklisted) {
          throw new UnauthorizedException('Token has been revoked');
        }
      } catch (e) {
        if (e instanceof UnauthorizedException) throw e;
        // Redis error (e.g. client closed): skip blacklist check, continue to JWT validation
      }
    }

    return super.canActivate(context) as Promise<boolean>;
  }

  handleRequest(err: any, user: any, info: any) {
    if (err || !user) {
      const message =
        err?.message ||
        (info?.message && String(info.message)) ||
        'Invalid or expired token';
      throw err || new UnauthorizedException(message);
    }
    return user;
  }
}

