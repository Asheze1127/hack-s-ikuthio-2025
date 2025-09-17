import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function GET(req: Request) {
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
        console.error(error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
