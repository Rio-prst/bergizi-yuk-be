import { HttpStatus } from '@nestjs/common';

export enum ErrorCode {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  FORBIDDEN = 'FORBIDDEN',
  UNAUTHORIZED = 'UNAUTHORIZED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface AppErrorBody {
  code: ErrorCode | string;
  message: string;
  details?: unknown;
}

export class AppError extends Error {
  constructor(
    readonly code: ErrorCode | string,
    message: string,
    readonly statusCode: HttpStatus,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(ErrorCode.NOT_FOUND, `${resource} tidak ditemukan`, HttpStatus.NOT_FOUND);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Akses tidak diizinkan') {
    super(ErrorCode.FORBIDDEN, message, HttpStatus.FORBIDDEN);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Autentikasi diperlukan') {
    super(ErrorCode.UNAUTHORIZED, message, HttpStatus.UNAUTHORIZED);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown) {
    super(ErrorCode.CONFLICT, message, HttpStatus.CONFLICT, details);
  }
}