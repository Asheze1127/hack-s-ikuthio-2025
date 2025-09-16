import { NextRequest, NextResponse } from "next/server";

export function GET(request: NextRequest): NextResponse {
    return NextResponse.json(
        { response: "Next.js API Success!!!" },
        {
          status: 200,  // ステータスコード
        },
  );
}

export function POST(request: NextRequest): NextResponse {
    return NextResponse.json(
        { response: "Next.js API Success!!!POST" },
        {
          status: 200,  // ステータスコード
        },
  );
}