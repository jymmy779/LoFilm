import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: NextRequest) {
  // Check credentials are configured
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error("[Contact] Telegram credentials are not configured in .env.local");
    return NextResponse.json(
      { error: "Server configuration error" },
      { status: 500 }
    );
  }

  let body: { name: string; email: string; subject: string; message: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { name, email, subject, message } = body;

  if (!name || !email || !message) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });

  // Escape special markdown characters to avoid Telegram parse errors
  const escape = (s: string) => s.replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

  const lines = [
    `📩 *TIN NHẮN LIÊN HỆ MỚI \\- LOFILM*`,
    ``,
    `👤 *Họ tên:* ${escape(name)}`,
    `📧 *Email:* ${escape(email)}`,
    `📌 *Chủ đề:* ${escape(subject || "Liên hệ chung")}`,
    `📝 *Nội dung:*`,
    `${escape(message.trim())}`,
    ``,
    `🕐 *Thời gian:* ${escape(now)}`,
  ]
    .filter(Boolean)
    .join("\n");

  const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

  try {
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: lines,
        parse_mode: "MarkdownV2",
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      console.error("[Contact] Telegram API error:", json);
      return NextResponse.json(
        { error: "Failed to send message to Telegram" },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Contact] Network error calling Telegram:", err);
    return NextResponse.json(
      { error: "Failed to reach notification service" },
      { status: 500 }
    );
  }
}
