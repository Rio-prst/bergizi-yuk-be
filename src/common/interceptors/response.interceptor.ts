import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import type { Request } from 'express';

/**
 * Wraps every successful response in the envelope defined in
 * docs/api-contract.md section 1.2: { data, meta: { requestId } }.
 */
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, { data: T; meta: { requestId?: string } }> {
  intercept(context: ExecutionContext, next: CallHandler<T>): Observable<{ data: T; meta: { requestId?: string } }> {
    const request = context.switchToHttp().getRequest<Request>();
    const requestId = request.headers['x-request-id'];

    return next.handle().pipe(
      map((data) => ({
        data,
        meta: typeof requestId === 'string' ? { requestId } : {},
      })),
    );
  }
}