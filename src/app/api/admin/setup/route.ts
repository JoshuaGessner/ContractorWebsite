import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminSessionCookieName,
  adminSessionDays,
  createSessionToken,
  getAdminCount,
  hashPassword,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const setupSchema = z.object({
  username: z.string().trim().min(3).max(40),
  password: z.string().min(8).max(120),
});

export async function POST(request: NextRequest) {
  const adminCount = await getAdminCount();

  if (adminCount > 0) {
    return NextResponse.json({ message: "Admin account already exists." }, { status: 409 });
  }

  const payload = await request.json();
  const parsed = setupSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid setup data." }, { status: 400 });
  }

  let admin;

  try {
    admin = await prisma.adminUser.create({
      data: {
        username: parsed.data.username,
        passwordHash: hashPassword(parsed.data.password),
      },
    });
  } catch {
    return NextResponse.json({ message: "Admin account already exists." }, { status: 409 });
  }

  const response = NextResponse.json({ message: "Admin account created." });
  response.cookies.set({
    name: adminSessionCookieName,
    value: createSessionToken(admin.id),
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: adminSessionDays * 24 * 60 * 60,
    path: "/",
  });

  return response;
}
