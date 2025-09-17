// /api/info_return

import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const username = searchParams.get('username')
        const password = searchParams.get('password')

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Missing username or password' },
                { status: 400 }
            )
        }

        // ユーザー検索
        const user = await prisma.user.findUnique({
            where: { username },
            select: { id: true, ink_amount: true, password: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // パスワード確認（本番では bcrypt 等でハッシュ比較する）
        if (user.password !== password) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }

        // 成功時に uuid と ink_amount を返す
        return NextResponse.json({
            id: user.id,               // ← uuid
            ink_amount: user.ink_amount,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}