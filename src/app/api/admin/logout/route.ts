import { NextResponse } from "next/server";
import { adminSessionCookieName } from "@/lib/admin-auth";

export async function POST() {
  const response = NextResponse.json({ message: "Logged out." });
  response.cookies.set({
    name: adminSessionCookieName,
    value: "",
    maxAge: 0,
    path: "/",
  });

  return response;
}
