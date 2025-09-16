import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function GET(_request: NextRequest): NextResponse {
  return NextResponse.json(
    { response: "Next.js API Success!!!" },
    {
      status: 200,  // ステータスコード
    },
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function POST(_request: NextRequest): NextResponse {
  return NextResponse.json(
    { response: "Next.js API Success!!!POST" },
    {
      status: 200,  // ステータスコード
    },
  );
}