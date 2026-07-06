import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import {
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from '@/services/property.service';

/**
 * Centralized API error handler
 * Maps custom errors to appropriate HTTP status codes
 * @param error - Error object
 * @returns NextResponse with appropriate status and error message
 */
export function handleApiError(error: unknown): NextResponse {
  console.error('API Error:', error);

  // Not Found - 404
  if (error instanceof NotFoundError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 404 }
    );
  }

  // Forbidden - 403
  if (error instanceof ForbiddenError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 403 }
    );
  }

  // Validation Error - 400
  if (error instanceof ValidationError) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 400 }
    );
  }

  // Zod Validation Error - 400
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        success: false,
        error: 'Validation failed',
        details: error.issues,
      },
      { status: 400 }
    );
  }

  // Unknown Error - 500 (no stack trace leak)
  return NextResponse.json(
    {
      success: false,
      error: 'An unexpected error occurred',
    },
    { status: 500 }
  );
}
