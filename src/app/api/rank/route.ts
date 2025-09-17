import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                score: true,
            },
            orderBy: {
                score: 'desc',
            },
            take: 10, // 上位10位まで
        });

        return NextResponse.json({
            rankings: users.map((user, index) => ({
                rank: index + 1,
                username: user.username,
                score: user.score || 0,
            })),
        });
    } catch (error) {
        console.error("Rank error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
