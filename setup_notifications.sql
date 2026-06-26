-- Script tạo bảng user_notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL, -- Người nhận thông báo
    actor_name text NOT NULL, -- Người thực hiện hành động
    actor_avatar text,
    type text NOT NULL, -- 'reply', 'like', 'dislike'
    comment_id uuid, -- Liên kết tới bình luận
    movie_slug text, -- Link để chuyển hướng
    content text, -- Trích dẫn nội dung bình luận
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cho phép đọc/ghi qua API
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Policy cho phép user đọc thông báo của chính mình
CREATE POLICY "Users can view their own notifications"
    ON public.user_notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Policy cho phép mọi người (đã đăng nhập) tạo thông báo
CREATE POLICY "Users can insert notifications"
    ON public.user_notifications FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL);

-- Policy cho phép user cập nhật thông báo của họ (đánh dấu đã đọc)
CREATE POLICY "Users can update their own notifications"
    ON public.user_notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Cho phép Supabase Realtime theo dõi bảng này
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_notifications;
