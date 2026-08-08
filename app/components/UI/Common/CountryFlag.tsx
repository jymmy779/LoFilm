"use client";

import Image from "next/image";

interface CountryFlagProps {
    name: string;
    className?: string;
}

// Map tên quốc gia tiếng Việt → mã ISO 2 ký tự (tương ứng file ảnh trong /public/images/flags)
const COUNTRY_CODE: Record<string, string> = {
    "Quốc Gia Khác": "un",
    "Quoc Gia Khac": "un",
    "Khác": "un",
    "Hàn Quốc": "kr",
    "Trung Quốc": "cn",
    "Nhật Bản": "jp",
    "Thái Lan": "th",
    "Âu Mỹ": "us",
    "Mỹ": "us",
    "Anh Mỹ": "us",
    "Đài Loan": "tw",
    "Hồng Kông": "hk",
    "Ấn Độ": "in",
    "Việt Nam": "vn",
    "Anh": "gb",
    "Pháp": "fr",
    "Đức": "de",
    "Tây Ban Nha": "es",
    "Thổ Nhĩ Kỳ": "tr",
    "Hà Lan": "nl",
    "Indonesia": "id",
    "Nga": "ru",
    "Mexico": "mx",
    "Úc": "au",
    "Thụy Điển": "se",
    "Malaysia": "my",
    "Brazil": "br",
    "Philippines": "ph",
    "Bồ Đào Nha": "pt",
    "Ý": "it",
    "Đan Mạch": "dk",
    "Ba Lan": "pl",
    "Ukraine": "ua",
    "Ukraina": "ua",
    "UAE": "ae",
    "Các Tiểu Vương Quốc Ả Rập": "ae",
    "Châu Phi": "za",
    "Nam Phi": "za",
    "Nigeria": "ng",
    "Kenya": "ke",
    "Canada": "ca",
    "Nauy": "no",
    "Na Uy": "no",
    "Phần Lan": "fi",
    "Thụy Sĩ": "ch",
    "Áo": "at",
    "Bỉ": "be",
    "Argentina": "ar",
    "Chile": "cl",
    "Colombia": "co",
    "Israel": "il",
    "Pakistan": "pk",
    "Ai Cập": "eg",
    "Ả Rập Xê Út": "sa",
    "Singapore": "sg",
    "New Zealand": "nz",
    "Séc": "cz",
    "Hungary": "hu",
    "Romania": "ro",
    "Hy Lạp": "gr",
};

export default function CountryFlag({ name, className = "w-6 h-4" }: CountryFlagProps) {
    const code = COUNTRY_CODE[name];
    if (!code) {
        // Các trường hợp chưa có bản đồ code → không render ảnh dead
        return null;
    }
    const ext = code === "un" ? "svg" : "png";
    return (
        <Image
            src={`/images/flags/${code}.${ext}`}
            alt={name}
            width={24}
            height={16}
            unoptimized
            style={{ width: '24px', height: '16px', display: 'inline-block' }}
            className={`object-cover rounded-[3px] border border-white/10 shadow-sm shrink-0 ${className}`}
        />
    );
}