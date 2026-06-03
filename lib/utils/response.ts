import { NextResponse } from "next/server";

export interface SuccessResponse<T> {
  traceId: string;
  success: true;
  data: T;
}

export interface ErrorResponse {
  traceId: string;
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function successResponse<T>(
  data: T,
  traceId: string,
  status = 200
): NextResponse<SuccessResponse<T>> {
  return NextResponse.json({ traceId, success: true, data }, { status });
}

export function errorResponse(
  code: string,
  message: string,
  traceId: string,
  status = 400,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json(
    { traceId, success: false, error: { code, message, details } },
    { status }
  );
}
