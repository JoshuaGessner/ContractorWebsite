import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  adminSessionCookieName,
  getAuthenticatedAdmin,
  hashPassword,
  verifyPassword,
} from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8).max(120),
    confirmPassword: z.string().min(8).max(120),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirm password must match.",
    path: ["confirmPassword"],
  });

export async function POST(request: NextRequest) {
  const admin = await getAuthenticatedAdmin();

  if (!admin) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  const payload = await request.json();
  const parsed = changePasswordSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid password data." }, { status: 400 });
  }

  const adminRecord = await prisma.adminUser.findUnique({
    where: { id: admin.id },
    select: { id: true, passwordHash: true },
  });

  if (!adminRecord) {
    return NextResponse.json({ message: "Unauthorized." }, { status: 401 });
  }

  if (!verifyPassword(parsed.data.currentPassword, adminRecord.passwordHash)) {
    return NextResponse.json({ message: "Current password is incorrect." }, { status: 400 });
  }

  if (verifyPassword(parsed.data.newPassword, adminRecord.passwordHash)) {
    return NextResponse.json({ message: "New password must be different from current password." }, { status: 400 });
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      passwordHash: hashPassword(parsed.data.newPassword),
    },
  });

  const response = NextResponse.json({ message: "Password updated. Please sign in again." });
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
