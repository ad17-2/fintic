import { NextResponse } from "next/server";

export function errorResponse(error: unknown, context: string): NextResponse {
  const message = error instanceof Error ? error.message : "Unknown error";
  console.error(`[${context}]`, message);
  return NextResponse.json(
    { error: "Internal server error" },
    { status: 500 }
  );
}
