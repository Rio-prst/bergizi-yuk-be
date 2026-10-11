import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

import { ErrorCode } from '../errors/app-error';

interface ZodIssueDetail {
  path: string;
  message: string;
}

@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const details: ZodIssueDetail[] = result.error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));

      throw new BadRequestException({
        code: ErrorCode.VALIDATION_ERROR,
        message: 'Input tidak valid',
        details,
      });
    }

    return result.data;
  }
}