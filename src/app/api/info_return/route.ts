// /api/info_return

import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// ログインAPIと同じ秘密鍵を使用
const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long';

export async function GET(req: Request) {
    try {
        // 1. ヘッダーからAuthorizationトークンを取得
        const authHeader = req.headers.get('Authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authorization header is missing or invalid' }, { status: 401 });
        }
        const token = authHeader.split(' ')[1];

        // 2. JWTを検証・デコード
        let decoded: Record<string, unknown>;
        try {
            decoded = jwt.verify(token, SECRET_KEY) as Record<string, unknown>;
        } catch {
            return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
        }

        // 3. デコードしたペイロードからユーザーIDを取得
        const userId = decoded.userId as string;
        if (!userId) {
            return NextResponse.json({ error: 'User ID not found in token' }, { status: 401 });
        }

        // 4. ユーザーIDでユーザー情報を検索
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, ink_amount: true },
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 5. 成功時にデータを返す
        return NextResponse.json({
            id: user.id,
            ink_amount: user.ink_amount,
        });

    } catch (error) {
        console.error('Info return error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}