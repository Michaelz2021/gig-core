import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        errors = (exceptionResponse as any).errors || null;
      } else {
        message = exceptionResponse;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    const errorResponse: Record<string, unknown> = {
      success: false,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };
    if (status === 401) {
      const hasAuth = !!request.headers?.authorization;
      errorResponse.hint =
        hasAuth
          ? 'Token invalid or expired. Log in again and use the new accessToken.'
          : 'No Authorization header. In Swagger: click Authorize, paste only the JWT (no "Bearer "), then try again. Try incognito or disable browser extensions.';
    }

    // Swagger 등에서 실제 성공/실패를 헤더로 구분할 수 있도록 설정 (success = 2xx, error = 4xx/5xx)
    response.setHeader('X-Api-Status', 'error');

    console.error('Exception:', {
      ...errorResponse,
      stack: exception instanceof Error ? exception.stack : null,
    });

    response.status(status).json(errorResponse);
  }
}
