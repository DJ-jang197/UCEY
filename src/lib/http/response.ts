import { NextResponse } from "next/server";

type ErrorPayload = {
  code: string;
  message: string;
  details?: unknown;
};

export function ok<T>(payload: T, init?: ResponseInit) {
  return NextResponse.json(payload, init);
}

export function fail(status: number, payload: ErrorPayload) {
  return NextResponse.json({ error: payload }, { status });
}
