import { NextRequest, NextResponse } from "next/server";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: NextRequest) {
  // Check credentials are configured
  if (!TELEGRAM_BOT_TOKEN) {
    console.error("[Report] TELEGRAM_BOT_TOKEN is not configured in .env.local");
    return NextResponse.json(
      { error: "Telegram bot token not configured" },
      { status: 500 }
    );
  }

  if (!TELEGRAM_CHAT_ID) {
    console.error("[Report] TELEGRAM_CHAT_ID is not configured in .env.local");
    return NextResponse.json(
      { error: "Telegram chat ID not configured" },
      { status: 500 }
    );
  }

  let body: {
    movieName?: string;
    episodeName?: string;
    errorType?: string;
    description?: string;
    context?: {
      userAgent: string;
      screenResolution: string;
      windowSize: string;
      language: string;
      url: string;
    }
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { movieName, episodeName, errorType, description, context } = body;

  if (!errorType || !movieName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const now = new Date().toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" });
  const clientIp = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "Unknown";

  // Escape special markdown characters to avoid Telegram parse errors
  const escape = (s: string) => s.toString().replace(/[_*[\]()~`>#+\-=|{}.!]/g, "\\$&");

  const lines = [
    `🚨 *BÁO LỖI PHIM \\- LOFILM PRO*`,
    ``,
    `🎬 *Phim:* ${escape(movieName)}`,
    episodeName ? `📺 *Tập:* ${escape(episodeName)}` : null,
    `❌ *Loại lỗi:* ${escape(errorType)}`,
    description?.trim() ? `📝 *Mô tả:* ${escape(description.trim())}` : null,
    ``,
    `🌐 *Trình duyệt:* \`${escape(context?.userAgent || "Unknown")}\``,
    `🖥 *Độ phân giải:* \`${escape(context?.screenResolution || "Unknown")}\` \\(\`${escape(context?.windowSize || "Unknown")}\`\\)`,
    `🌍 *IP:* \`${escape(clientIp)}\``,
    `🔗 *URL:* [Xem tại đây](${escape(context?.url || "")})`,
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
      console.error("[Report] Telegram API error:", json);
      return NextResponse.json(
        { error: "Telegram API rejected the request", detail: json },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[Report] Network error calling Telegram:", err);
    return NextResponse.json(
      { error: "Failed to reach Telegram API" },
      { status: 500 }
    );
  }
}
