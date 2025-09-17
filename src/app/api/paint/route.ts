import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const { user_id, zoom, tile_x, tile_y, cells } = await req.json();
        const numCells = cells.length;

        // トランザクションで一括保存＋ユーザースコア・インク更新
        const result = await prisma.$transaction(async (tx) => {
            let overWriteCells = 0;

            const savedCells = await Promise.all(
                cells.map(async (cell: { cell_x: number; cell_y: number; color: string }) => {//一回のクエリ送りたい
                    const currentCell = await tx.cell.findFirst({
                        where: {
                            zoom,
                            tileX: tile_x,
                            tileY: tile_y,
                            cellX: cell.cell_x,
                            cellY: cell.cell_y,
                        },
                    });

                    if (currentCell) {
                        overWriteCells++;
                        
                        return tx.cell.update({
                            where: { id: currentCell.id },
                            data: {
                                color: cell.color,
                                userId: user_id,
                                zoom,
                                tileX: tile_x,
                                tileY: tile_y,
                                cellX: cell.cell_x,
                                cellY: cell.cell_y,
                            },
                        });
                    } else {
                        return tx.cell.create({
                            data: {
                                userId: user_id,
                                zoom,
                                tileX: tile_x,
                                tileY: tile_y,
                                cellX: cell.cell_x,
                                cellY: cell.cell_y,
                                color: cell.color,
                            },
                        });
                    }
                })
            );

            // ユーザーのインクとスコアを更新
            const updatedUser = await tx.user.update({
                where: { id: user_id },
                data: {
                    // スコアは塗ったセル数を加算
                    score: { increment: numCells },
                    // インクは新規塗り1消費、上書き時は2消費
                    ink_amount: { decrement: (numCells + overWriteCells) },
                },
            });

            if (updatedUser.ink_amount < 0) {
                // インク不足ならロールバック
                throw new Error("Insufficient ink");
            }

            return { savedCells, remainingInk: updatedUser.ink_amount };
        });

        return NextResponse.json({
            status: "success!",
            painted_count: result.savedCells.length,
            remaining_paint: result.remainingInk,
        });
    } catch (error) {
        console.error("Paint error:", error);
        if (error instanceof Error && error.message === "Insufficient ink") {
            return NextResponse.json({ error: "Insufficient ink" }, { status: 400 });
        }
        return NextResponse.json(
            {
                error: "Internal server error",
                details: error instanceof Error ? error.message : String(error),
            },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
      const { searchParams } = new URL(req.url);
      const zoom = Number(searchParams.get("zoom"));
      const tileX = Number(searchParams.get("tile_x"));
      const tileY = Number(searchParams.get("tile_y"));
  
      if (isNaN(zoom) || isNaN(tileX) || isNaN(tileY)) {
        return NextResponse.json({ error: "Invalid query params" }, { status: 400 });
      }
  
      // DBからこのタイルに属するセルを取得
      const cells = await prisma.cell.findMany({
        where: {
          zoom,
          tileX,
          tileY
        },
        select: {
          cellX: true,
          cellY: true,
          color: true,
          userId: true
        }
      });
  
      return NextResponse.json({
        zoom,
        tile_x: tileX,
        tile_y: tileY,
        cells // そのまま返す
      });
    } catch (error) {
      console.error("Paint GET error:", error);
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }
