import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ★★★ CORS許可設定を追加 ★★★
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
};

// ★★★ OPTIONSメソッドへの対応を追加 ★★★
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function OPTIONS(_request: Request) {
    return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(_req: Request) {
    try {
        const { tile_x, tile_y, cell_x, cell_y } = await _req.json();

        // 今日の日付（時間は00:00:00）
        const today = new Date();
        const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        const button = await prisma.button.findFirst({
            where: {
                date: {
                    gte: dateOnly,
                    lt: new Date(dateOnly.getTime() + 24 * 60 * 60 * 1000) // 翌日の00:00:00
                }
            }
        });

        const button_id = button?.id;

        console.log(button_id);
        // isPushがfalseの参加者数を取得
        const notPushedCount = await prisma.participant.count({
            where: {
                isPush: false,
                button_id
            }
        });

        // ボタンを押した参加者数
        const pushCount = await prisma.participant.count({
            where: {
                isPush: true,
                button_id
            }
        });

        const totalCount = notPushedCount + pushCount;

        // 少ない方が勝ち
        const isPushWinner = pushCount < notPushedCount;
        const winnerCount = isPushWinner ? pushCount : notPushedCount;
        const loserCount = isPushWinner ? notPushedCount : pushCount;

        // インク計算: 勝者数が全体の半分以下の場合、インクを獲得
        let inkAmountToAdd = 0;
        if (totalCount > 0) {
            const winnerRatio = winnerCount / totalCount;
            if (winnerRatio <= 0.5) {
                // 勝者数が少ないほど多くのインクを獲得
                inkAmountToAdd = Math.floor((0.5 - winnerRatio) * 1000) + 5;
            }
        }

        // 勝者（少ない方）のparticipantのuser_idを取得
        const winnerParticipants = await prisma.participant.findMany({
            where: {
                isPush: isPushWinner,
                button_id
            },
            select: {
                user_id: true
            }
        });

        const winnerUserIds = winnerParticipants.map(p => p.user_id);

        if (winnerUserIds.length > 0) {
            await prisma.user.updateMany({
                where: {
                    id: { in: winnerUserIds }
                },
                data: {
                    ink_amount: { increment: inkAmountToAdd }
                }
            });
        }

        await prisma.button.create({
            data: {
                tile_x,
                tile_y,
                cell_x,
                cell_y,
            }
        });

        return NextResponse.json({
            status: "success",
            result: {
                totalCount,
                pushCount,
                notPushedCount,
                isPushWinner,
                winnerCount,
                loserCount,
                inkAmountToAdd,
                winnerUserIds: winnerUserIds.length
            }
        }, { headers: corsHeaders });

    } catch (err) {
        console.error("Result GET error:", err);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500, headers: corsHeaders }
        );
    }
}
