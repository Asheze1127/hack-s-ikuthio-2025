import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

// ★★★ CORS許可設定を追加 ★★★
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// ★★★ OPTIONSメソッドへの対応を追加 ★★★
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_request: Request) {
    return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(_req: Request) {
    try {
        const { username, password } = await _req.json();

        // ユーザーが既に存在するか確認
        const existingUser = await prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return NextResponse.json(
                { error: "Username already exists" },
                // ★★★ レスポンスにCORSヘッダーを追加 ★★★
                { status: 409, headers: corsHeaders }
            );
        }

        // パスワードをハッシュ化
        const hashedPassword = await hash(password, 10);

        // ユーザーを作成
        const user = await prisma.user.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        // ★★★ 成功時のレスポンスにもCORSヘッダーを追加 ★★★
        return NextResponse.json({ id: user.id, username: user.username }, { headers: corsHeaders });

    } catch (err) {
        console.error("Signup error:", err);
        // ★★★ エラー時にもCORSヘッダーを追加 ★★★
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: corsHeaders }
        );
    }
}