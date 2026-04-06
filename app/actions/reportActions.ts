"use server";

export async function reportCommentToTelegram(data: {
    author: string;
    content: string;
    commentId: string;
    movieSlug?: string;
    reportedBy?: string;
}) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
        console.error("Telegram credentials missing in environment variables.");
        return { success: false, error: "Cấu hình Telegram chưa hoàn thiện." };
    }

    const message = `
⚠️ [BÁO CÁO BÌNH LUẬN]

👤 Tác giả: ${data.author}
💬 Nội dung: "${data.content}"
🎬 Phim: ${data.movieSlug || "Không xác định"}
🆔 Comment ID: ${data.commentId}

🚨 Người báo cáo: ${data.reportedBy || "Ẩn danh"}
🔗 Link: [Nhấn để xem](https://lofilm.vn/phim/${data.movieSlug || ""})
    `.trim();

    try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
                parse_mode: 'Markdown'
            }),
        });

        if (!response.ok) {
            throw new Error(`Telegram API responded with ${response.status}`);
        }

        return { success: true };
    } catch (error) {
        console.error("Error sending Telegram report:", error);
        return { success: false, error: "Không thể gởi báo cáo về Telegram." };
    }
}
