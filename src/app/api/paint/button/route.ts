// /api/paint
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";



export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action } = body;

        if (action === "participate") {
            // 参加表明
            const { button_id, user_id } = body;

            // 既に参加しているかチェック
            const existingParticipant = await prisma.participant.findFirst({
                where: {
                    button_id,
                    user_id
                }
            });

            if (existingParticipant) {
                return NextResponse.json({ error: "Already participating" }, { status: 400 });
            }

            // 参加者を追加
            const participant = await prisma.participant.create({
                data: {
                    button_id,
                    user_id,
                    isPush: false
                }
            });

            return NextResponse.json({
                status: "success",
                message: "Participation registered",
                participant: participant
            });

        } else if (action === "push") {
            // ボタンを押す
            const { button_id, user_id } = body;

            // 参加者かチェック
            const participant = await prisma.participant.findFirst({
                where: {
                    button_id,
                    user_id
                }
            });

            if (!participant) {
                return NextResponse.json({ error: "Not participating" }, { status: 400 });
            }

            if (participant.isPush) {
                return NextResponse.json({ error: "Already pushed" }, { status: 400 });
            }

            // ボタンを押したことを記録
            await prisma.participant.update({
                where: { id: participant.id },
                data: { isPush: true }
            });

            // ボタンのsuccessカウントを増やす
            const updatedButton = await prisma.button.update({
                where: { id: button_id },
                data: { success: { increment: 1 } }
            });

            return NextResponse.json({
                status: "success",
                message: "Button pushed",
                button: updatedButton
            });

        } else if (action === "create") {
            // ボタンを作成（管理者用）
            const { tile_x, tile_y, cell_x, cell_y } = body;

            // 今日の日付（時間は00:00:00）
            const today = new Date();
            const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

            const button = await prisma.button.create({
                data: {
                    tile_x,
                    tile_y,
                    cell_x,
                    cell_y,
                    date: dateOnly,
                }
            });

            return NextResponse.json({
                status: "success",
                button: button
            });

        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

    } catch (error) {
        console.error("Button POST error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
    try {
        // 今日の日付（時間は00:00:00）
        const today = new Date();
        const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

        // 正しい日付フィルタリング（範囲指定）
        const buttons = await prisma.button.findMany({
            where: {
                date: {
                    gte: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate()),
                    lt: new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate() + 1)
                }
            }
        });

        return NextResponse.json({
            status: "success",
            buttons: buttons,
        });
    } catch (error) {
        console.error("Button GET error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
