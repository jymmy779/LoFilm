"use client";
import { useState, useTransition, useEffect } from "react";
import { deleteExclusiveMovie } from "@/app/actions/adminMovies";
import { updateSiteSetting } from "@/app/actions/adminSettings";
import Link from "next/link";
import toast from "react-hot-toast";
import HeroSliderTab from "./HeroSliderTab";
import EditorChoicesTab from "./EditorChoicesTab";
import TopicsTab from "./TopicsTab";

export default function AdminDashboard({ initialStats, initialSettings, initialStarredMovies }: { initialStats: { moviesCount: number, episodesCount: number, sourcesCount: number }, initialSettings: any, initialStarredMovies?: any[] }) {
    const [stats, setStats] = useState(initialStats);
    const [settings, setSettings] = useState(initialSettings);
    const [activeTab, setActiveTab] = useState<"stats" | "settings" | "hero" | "editor" | "topics">("stats");
    const [isPending, startTransition] = useTransition();
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setStats(initialStats);
    }, [initialStats]);

    useEffect(() => {
        setSettings(initialSettings);
        setHasChanges(false);
    }, [initialSettings]);

    const handleChangeSetting = (key: string, value: any) => {
        setSettings({ ...settings, [key]: value });
        setHasChanges(true);
    };

    const saveAllSettings = () => {
        startTransition(async () => {
            const keysToSave = Object.keys(settings);
            let hasError = false;
            
            for (const key of keysToSave) {
                if (settings[key] !== initialSettings[key]) {
                    const res = await updateSiteSetting(key, settings[key]);
                    if (res?.error) hasError = true;
                }
            }
            
            if (hasError) {
                toast.error("Có lỗi xảy ra khi lưu một số cài đặt!");
            } else {
                toast.success("Đã lưu tất cả cấu hình thành công!");
                setHasChanges(false);
            }
        });
    };

    return (
        <div>
            {/* Tabs */}
            <div className="flex flex-wrap gap-4 mb-6 border-b border-white/10 pb-2">
                <button 
                    onClick={() => setActiveTab("stats")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'stats' ? 'text-[#D497FF] border-b-2 border-[#D497FF]' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-chart-pie mr-2"></i> Tổng quan
                </button>
                <button 
                    onClick={() => setActiveTab("settings")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'settings' ? 'text-[#D497FF] border-b-2 border-[#D497FF]' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-cog mr-2"></i> Cấu hình Website
                </button>
                <button 
                    onClick={() => setActiveTab("hero")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'hero' ? 'text-[#D497FF] border-b-2 border-[#D497FF]' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-star mr-2"></i> Hero Slider
                </button>
                <button 
                    onClick={() => setActiveTab("editor")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'editor' ? 'text-[#D497FF] border-b-2 border-[#D497FF]' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-award mr-2"></i> Editor's Choices
                </button>
                <button 
                    onClick={() => setActiveTab("topics")}
                    className={`pb-2 px-2 font-medium transition ${activeTab === 'topics' ? 'text-[#D497FF] border-b-2 border-[#D497FF]' : 'text-gray-400 hover:text-white'}`}
                >
                    <i className="fa-solid fa-list mr-2"></i> Quản lý Chủ đề
                </button>
            </div>

            {/* Stats Tab */}
            {activeTab === "stats" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-[#0F1115] border border-white/5 rounded-xl p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center text-2xl">
                            <i className="fa-solid fa-film"></i>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Tổng Số Phim</div>
                            <div className="text-3xl font-bold">{stats.moviesCount.toLocaleString()}</div>
                        </div>
                    </div>
                    

                    
                    <div className="bg-[#0F1115] border border-white/5 rounded-xl p-6 flex items-center gap-4">
                        <div className="w-14 h-14 rounded-full bg-green-500/10 text-green-400 flex items-center justify-center text-2xl">
                            <i className="fa-solid fa-play"></i>
                        </div>
                        <div>
                            <div className="text-gray-400 text-sm">Tổng Số Tập Phim</div>
                            <div className="text-3xl font-bold">{stats.episodesCount.toLocaleString()}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Editor Choices Tab */}
            {activeTab === "editor" && (
                <EditorChoicesTab initialConfig={initialSettings?.editor_choices || { mode: "manual", autoCount: 30, movies: [] }} />
            )}

            {/* Topics Tab */}
            {activeTab === "topics" && (
                <TopicsTab initialTopics={initialSettings?.home_topics} />
            )}

            {/* Hero Slider Tab */}
            {activeTab === "hero" && (
                <HeroSliderTab initialStarredMovies={initialStarredMovies || []} />
            )}

            {/* Settings Tab */}
            {activeTab === "settings" && (
                <div className="bg-[#0F1115] rounded-lg p-6 border border-white/5 max-w-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold">Cấu hình chung</h3>
                        {hasChanges && (
                            <button
                                onClick={saveAllSettings}
                                disabled={isPending}
                                className="bg-[#D497FF] hover:bg-[#D497FF] text-black px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm animate-fade-in"
                            >
                                {isPending ? <i className="fa-solid fa-spinner fa-spin"></i> : <i className="fa-solid fa-save"></i>}
                                Lưu thay đổi
                            </button>
                        )}
                    </div>
                    
                    <div className="mb-6 flex items-center justify-between p-4 bg-[#0F1115] rounded-lg">
                        <div>
                            <div className="font-medium text-lg">Chế độ Bảo trì</div>
                            <div className="text-sm text-gray-400">Đóng website tạm thời, chuyển tất cả traffic về trang /maintenance</div>
                        </div>
                        <button 
                            disabled={isPending}
                            onClick={() => handleChangeSetting('maintenance_mode', !settings.maintenance_mode)}
                            className={`w-14 h-7 rounded-full transition-colors relative ${settings.maintenance_mode ? 'bg-red-500' : 'bg-gray-600'}`}
                        >
                            <span className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white rounded-full transition-all ${settings.maintenance_mode ? 'right-1' : 'left-1'}`}></span>
                        </button>
                    </div>

                    <div className="p-4 bg-[#0F1115] rounded-lg mb-6">
                        <div className="mb-3">
                            <div className="font-medium text-lg">Sự kiện Đặc biệt (Hiệu ứng)</div>
                            <div className="text-sm text-gray-400">Kích hoạt các hiệu ứng đặc biệt trên toàn trang web.</div>
                        </div>
                        <select 
                            value={settings.active_event || 'none'}
                            onChange={(e) => handleChangeSetting('active_event', e.target.value)}
                            disabled={isPending}
                            className="w-full bg-[#0F1115] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF]"
                        >
                            <option value="none">Không có sự kiện (Mặc định)</option>
                            <option value="reunification">Giải phóng Miền Nam 30/4</option>
                        </select>
                    </div>

                    <h3 className="text-xl mb-6 font-semibold border-t border-white/10 pt-6">Thông tin liên hệ & Mạng xã hội</h3>
                    
                    <div className="space-y-4">
                        {[
                            { key: 'contact_telegram', label: 'Telegram URL', icon: 'fa-telegram', color: 'text-[#0088cc]' },
                            { key: 'contact_telegram_name', label: 'Telegram Name (hiển thị)', icon: 'fa-telegram', color: 'text-[#0088cc]' },
                            { key: 'contact_discord', label: 'Discord URL', icon: 'fa-discord', color: 'text-[#5865F2]' },
                            { key: 'contact_facebook', label: 'Facebook URL', icon: 'fa-facebook', color: 'text-[#1877F2]' },
                            { key: 'contact_twitter', label: 'X (Twitter) URL', icon: 'fa-x-twitter', color: 'text-white' },
                            { key: 'contact_threads', label: 'Threads URL', icon: 'fa-threads', color: 'text-white' },
                            { key: 'contact_youtube', label: 'YouTube URL', icon: 'fa-youtube', color: 'text-[#FF0000]' },
                        ].map((field) => (
                            <div key={field.key} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-[#0F1115] rounded-lg gap-4">
                                <div className="flex items-center gap-3 w-1/3">
                                    <i className={`fa-brands ${field.icon} text-2xl ${field.color}`}></i>
                                    <div className="font-medium">{field.label}</div>
                                </div>
                                <input
                                    type="text"
                                    value={settings[field.key] || ''}
                                    placeholder={`Nhập ${field.label}...`}
                                    onChange={(e) => handleChangeSetting(field.key, e.target.value)}
                                    disabled={isPending}
                                    className="flex-1 bg-[#0F1115] text-white rounded p-3 focus:outline-none focus:ring-2 focus:ring-[#D497FF] border border-white/10"
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
