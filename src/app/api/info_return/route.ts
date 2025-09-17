// /api/info_return

import { NextResponse } from 'next/server'
import { prisma } from "@/lib/prisma";

const p = new prisma();

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json()

        // ユーザー検索
        const user = await p.user.findUnique({
            where: { username },
            select: { id: true, ink_amount: true, password: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // login成功条件
        if (user.password !== password) {
            return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
        }

        // id と ink_amount を返す
        return NextResponse.json({
            id: user.id,
            ink_amount: user.ink_amount,
        })
        
    } catch (error) {
        console.error(error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
