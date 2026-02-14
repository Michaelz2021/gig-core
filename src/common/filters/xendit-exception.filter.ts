import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  HttpException,
} from '@nestjs/common';

@Catch()
export class XenditExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Xendit SDK/API errors
    if (exception.name === 'XenditError') {
      return response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Payment processing failed',
        error: exception.message,
      });
    }

    // Nest HttpException (BadRequest, Unauthorized, GatewayTimeout 등) — rethrow 시 프로세스가 죽어 클라이언트가 000 받는 문제 방지
    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();
      const message = typeof res === 'object' && res && (res as any).message != null
        ? (res as any).message
        : String(res);
      return response.status(status).json({
        success: false,
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request?.url,
        method: request?.method,
        message: Array.isArray(message) ? message[0] : message,
      });
    }

    // 그 외: 500
    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      statusCode: 500,
      message: exception?.message ?? 'Internal server error',
    });
  }
}
