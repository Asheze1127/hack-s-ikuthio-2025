import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcrypt";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: Request) {
    return NextResponse.json({ response: "Signup API Success!!!" });
}

export async function POST(req: Request) {
    try {
        const { username, password } = await req.json();

        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            return NextResponse.json({ error: "Username already exists" }, { status: 400 });
        }

        const hashed = await hash(password, 10);

        const user = await prisma.user.create({
            data: { username, password: hashed },
        });

        return NextResponse.json({ id: user.id, username: user.username });
    } catch (error) {
        console.error("Signup error:", error);
        return NextResponse.json({
            error: "Internal server error",
            details: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
