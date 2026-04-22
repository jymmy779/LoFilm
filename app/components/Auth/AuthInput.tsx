"use client";

import React, { useState } from "react";
import { LucideIcon, Eye, EyeOff } from "lucide-react";

interface AuthInputProps {
  type: string;
  name: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon: LucideIcon;
  autoComplete?: string;
  required?: boolean;
}

export default function AuthInput({
  type,
  name,
  placeholder,
  value,
  onChange,
  icon: Icon,
  autoComplete,
  required = true,
}: AuthInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40">
        <Icon size={18} />
      </div>
      <input
        type={isPassword ? (showPassword ? "text" : "password") : type}
        name={name}
        autoComplete={autoComplete}
        required={required}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 md:py-4 pl-12 pr-12 text-white placeholder:text-white/20 focus:outline-none focus:border-amber-400/50 focus:bg-white/10 transition-all text-xs md:text-sm`}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
}
