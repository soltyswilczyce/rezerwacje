import { NextRequest, NextResponse } from "next/server";
import { verifyAdminPassword, createAdminToken, COOKIE_NAME } from "@/lib/auth";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Nieprawidłowe dane" }, { status: 400 });
  }

  if (!body.password) {
    return NextResponse.json({ error: "Podaj hasło" }, { status: 400 });
  }

  const isValid = await verifyAdminPassword(body.password);
  if (!isValid) {
    // Celowe opóźnienie utrudniające brute-force
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ error: "Nieprawidłowe hasło" }, { status: 401 });
  }

  const token = await createAdminToken();

  const response = NextResponse.json({ success: true });
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 8, // 8 godzin
    path: "/",
  });

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
