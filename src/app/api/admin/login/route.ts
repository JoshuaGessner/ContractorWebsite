import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminSessionDays,
  adminSessionCookieName,
  createSessionToken,
  getAdminCount,
  verifyPassword,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  const adminCount = await getAdminCount();

  if (adminCount === 0) {
    return NextResponse.json({ message: "Admin setup required." }, { status: 409 });
  }

  const payload = await request.json();
  const parsed = loginSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid login data." }, { status: 400 });
  }

  const admin = await prisma.adminUser.findUnique({
    where: { username: parsed.data.username },
  });

  if (!admin || !verifyPassword(parsed.data.password, admin.passwordHash)) {
    return NextResponse.json({ message: "Invalid username or password." }, { status: 401 });
  }

  const response = NextResponse.json({ message: "Logged in." });
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
