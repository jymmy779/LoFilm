"use client";

import React, { useState } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ContactForm() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: 'Báo lỗi phim',
        message: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
            toast.error("Vui lòng điền đầy đủ các thông tin bắt buộc!");
            return;
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi sớm nhất.");
                setFormData({
                    name: '',
                    email: '',
                    subject: 'Báo lỗi phim',
                    message: ''
                });
            } else {
                toast.error(result.error || "Có lỗi xảy ra khi gửi tin nhắn.");
            }
        } catch (error) {
            console.error("Lỗi gửi form:", error);
            toast.error("Không thể kết nối tới máy chủ.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="lg:col-span-2 bg-[#12151C] border border-white/5 p-6 md:p-12 rounded-3xl md:rounded-[40px] shadow-2xl relative overflow-hidden">
            <div className="mb-6 md:mb-10">
                <h2 className="text-lg md:text-xl font-bold text-white mb-2 uppercase tracking-widest">Gửi lời nhắn</h2>
                <p className="text-white/20 text-[10px] md:text-xs italic">Điền đầy đủ thông tin bên dưới để chúng tôi có thể liên hệ lại sớm nhất.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Họ và tên</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Nguyễn Văn A"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-xs md:text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-amber-400/30 transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-1.5 md:space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Địa chỉ Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="example@gmail.com"
                            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-xs md:text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-amber-400/30 transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Chủ đề</label>
                    <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs md:text-sm text-white focus:outline-none focus:border-amber-400/30 transition-all appearance-none cursor-pointer"
                    >
                        <option value="Báo lỗi phim" className="bg-[#0F1115]">Báo lỗi phim</option>
                        <option value="Yêu cầu phim mới" className="bg-[#0F1115]">Yêu cầu phim mới</option>
                        <option value="Ý kiến đóng góp" className="bg-[#0F1115]">Ý kiến đóng góp</option>
                        <option value="Hợp tác/Quảng cáo" className="bg-[#0F1115]">Hợp tác/Quảng cáo</option>
                    </select>
                </div>

                <div className="space-y-1.5 md:space-y-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest pl-1">Nội dung tin nhắn</label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        rows={4}
                        placeholder="Hãy cho chúng tôi biết bạn đang nghĩ gì..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-5 text-xs md:text-sm text-white placeholder:text-white/10 focus:outline-none focus:border-amber-400/30 transition-all resize-none font-medium"
                    ></textarea>
                </div>

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-amber-400 cursor-pointer hover:bg-amber-500 disabled:bg-amber-400/50 disabled:cursor-not-allowed text-black font-bold py-3 md:py-4 rounded-xl text-xs md:text-sm flex items-center justify-center gap-2 md:gap-3 transition-all active:scale-[0.98] shadow-lg shadow-amber-400/5 uppercase tracking-widest"
                >
                    {isSubmitting ? (
                        <>
                            Đang gửi...
                            <Loader2 size={16} className="animate-spin" />
                        </>
                    ) : (
                        <>
                            Gửi tin nhắn ngay
                            <Send size={16} />
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
