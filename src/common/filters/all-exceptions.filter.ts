import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { AppError, ErrorCode } from '../errors/app-error';

interface ErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, payload } = this.resolve(exception);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `${request.method} ${request.url} -> ${status} ${payload.code}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(status).json({
      error: payload,
      meta: { requestId: request.headers['x-request-id'] },
    });
  }

  private resolve(exception: unknown): { status: HttpStatus; payload: ErrorPayload } {
    if (exception instanceof AppError) {
      return {
        status: exception.statusCode,
        payload: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
        },
      };
    }

    if (exception instanceof HttpException) {
      const status: HttpStatus = exception.getStatus();
      const body = exception.getResponse();

      if (typeof body === 'object' && body !== null) {
        const record = body as Record<string, unknown>;
        return {
          status,
          payload: {
            code: typeof record.code === 'string' ? record.code : this.codeForStatus(status),
            message:
              typeof record.message === 'string'
                ? record.message
                : ((record.message as string[] | undefined)?.join(', ') ?? exception.message),
            details: record.details,
          },
        };
      }

      return {
        status,
        payload: { code: this.codeForStatus(status), message: String(body) },
      };
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      payload: {
        code: ErrorCode.INTERNAL_ERROR,
        message: 'Terjadi kesalahan pada server',
      },
    };
  }

  private codeForStatus(status: HttpStatus): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_ERROR;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.CONFLICT;
      default:
        return ErrorCode.INTERNAL_ERROR;
    }
  }
}