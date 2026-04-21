import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/utils/supabase/server';

const BOT_TOKEN = process.env.NOTIFY_TELEGRAM_BOT_TOKEN;
const ALLOWED_USER_ID = process.env.NOTIFY_ALLOWED_USER_ID;

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();

        // Handle Telegram Webhook
        const message = body.message;
        if (!message || !message.text || !message.from) {
            return NextResponse.json({ ok: true }); // Acknowledge other types of messages
        }

        const userId = message.from.id.toString();
        const text = message.text.trim();

        // Security check: Only allow the specific user
        if (userId !== ALLOWED_USER_ID) {
            console.log(`Unauthorized notification attempt from ID: ${userId}`);
            return NextResponse.json({ ok: true });
        }

        const supabase = await createClient();

        // Parsing message for expiration and type
        // Pattern: [days] message
        // Example: [7] Chúng mình đã sửa lỗi rồi nhé!
        let daysActive = 3; // Default 3 days
        let cleanMessage = text;

        const match = text.match(/^\[(\d+)\]\s*(.*)/);
        if (match) {
            daysActive = parseInt(match[1]);
            cleanMessage = match[2];
        }

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + daysActive);

        // 1. Deactivate old notifications (since user wants simplified "one at a time" feel)
        await supabase
            .from('site_notifications')
            .update({ is_active: false })
            .eq('is_active', true);

        // 2. Insert new notification
        const { error } = await supabase
            .from('site_notifications')
            .insert([
                {
                    message: cleanMessage,
                    is_active: true,
                    expires_at: expiresAt.toISOString(),
                    type: 'info'
                }
            ]);

        if (error) {
            console.error('Error inserting notification:', error);
            // Optionally send an error message back to the user via Telegram
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}
