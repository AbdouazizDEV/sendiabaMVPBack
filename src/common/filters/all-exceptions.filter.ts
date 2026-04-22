import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ApiErrorPayload {
  code: string;
  message: string;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorPayload = this.extractErrorPayload(exception);

    this.logger.error(
      `${request.method} ${request.url} -> ${status}`,
      exception instanceof Error ? exception.stack : String(exception),
    );

    response.status(status).json({
      success: false,
      error: errorPayload,
    });
  }

  private extractErrorPayload(exception: unknown): ApiErrorPayload {
    if (!(exception instanceof HttpException)) {
      return {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
      };
    }

    const response = exception.getResponse();
    if (typeof response === 'string') {
      return {
        code: 'HTTP_EXCEPTION',
        message: response,
      };
    }

    if (typeof response === 'object' && response !== null) {
      const mapped = response as { code?: string; message?: string | string[] };
      const message = Array.isArray(mapped.message)
        ? mapped.message.join(', ')
        : mapped.message;
      return {
        code: mapped.code ?? 'HTTP_EXCEPTION',
        message: message ?? 'Request failed',
      };
    }

    return {
      code: 'HTTP_EXCEPTION',
      message: 'Request failed',
    };
  }
}
