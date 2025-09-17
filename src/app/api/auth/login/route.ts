import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // まずは "*" で許可。あとで localhost に限定も可能
  "Access-Control-Allow-Methods": "POST, OPTIONS", // 許可するHTTPメソッド
  "Access-Control-Allow-Headers": "Content-Type", // 許可するリクエストヘッダー
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_request: Request) {
  return new NextResponse(null, { headers: corsHeaders });
}

// POSTメソッドの処理
export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();
    const user = await prisma.user.findUnique({ where: { username } });

    if (!user) {
      // 失敗時にもCORSヘッダーを返す
      return new NextResponse(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // 失敗時にもCORSヘッダーを返す
      return new NextResponse(JSON.stringify({ message: 'Invalid credentials' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const token = jwt.sign({ userId: user.id, username: user.username }, SECRET_KEY, {
      expiresIn: '1h',
    });


    return new NextResponse(JSON.stringify({ token }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  } catch (error) {
    console.error(error);
    // エラー時にもCORSヘッダーを返す
    return new NextResponse(JSON.stringify({ message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
}