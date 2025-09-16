import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                score: true,
                country_id: true,
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
                country_id: user.country_id,
            })),
        });
    } catch (error) {
        console.error("Rank error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
