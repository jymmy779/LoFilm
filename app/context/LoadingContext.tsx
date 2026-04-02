"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";

interface LoadingContextType {
    register: (id: string) => void;
    finish: (id: string) => void;
    isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
    const [pending, setPending] = useState<Set<string>>(new Set());
    const [isInitialLoading, setIsInitialLoading] = useState(true);

    const register = useCallback((id: string) => {
        setPending((prev) => {
            const next = new Set(prev);
            next.add(id);
            return next;
        });
    }, []);

    const finish = useCallback((id: string) => {
        setPending((prev) => {
            const next = new Set(prev);
            next.delete(id);
            return next;
        });
    }, []);

    // Nếu không còn mục nào đang tải, coi như xong
    useEffect(() => {
        if (pending.size === 0 && isInitialLoading) {
            // Đợi một xíu nữa cho chắc chắn React đã render xong
            const timer = setTimeout(() => {
                setIsInitialLoading(false);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [pending, isInitialLoading]);

    return (
        <LoadingContext.Provider value={{ register, finish, isLoading: isInitialLoading }}>
            {children}
        </LoadingContext.Provider>
    );
}

export function useLoading() {
    const context = useContext(LoadingContext);
    if (!context) {
        throw new Error("useLoading must be used within a LoadingProvider");
    }
    return context;
}
