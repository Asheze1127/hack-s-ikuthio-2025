import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import jwt from "jsonwebtoken"; // JWTをインポート

// JWTの秘密鍵。実際には .env ファイルで管理すべきです。
const SECRET_KEY = process.env.JWT_SECRET || 'your-super-secret-key-that-is-long';

// CORS設定（念のため記載）
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_request: Request) {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(_req: Request) {
  try {
    const { username, password } = await _req.json();

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401, headers: corsHeaders });
    }

    // ★★★【デバッグ用ログ】★★★
    // Vercelのログで、実際に比較される値を確認します
    console.log("--- Password Comparison ---");
    console.log("Password from Request:", `"${password}"`); // 受け取ったパスワード
    console.log("Hashed Password from DB:", `"${user.password}"`); // DBに保存されているハッシュ

    const isValid = await compare(password, user.password);

    console.log("Comparison Result (isValid):", isValid); // 比較結果
    console.log("--------------------------");
    // ★★★【ここまで】★★★

    if (!isValid) {
      return NextResponse.json({ error: "Invalid username or password" }, { status: 401, headers: corsHeaders });
    }

    // ★★★【JWT生成処理】★★★
    // 認証に成功したら、JWTを生成する
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' } // トークンの有効期限
    );

    // ★★★【JWTをレスポンスで返す】★★★
    // フロントエンドが期待している 'token' を返す
    return NextResponse.json({ token }, { headers: corsHeaders });

  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}