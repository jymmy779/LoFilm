import React from "react";

interface ContainerProps {
    children: React.ReactNode;
    className?: string;
    as?: React.ElementType;
}

export default function Container({ children, className = "", as: Component = "div" }: ContainerProps) {
    return (
        <Component className={`w-full max-w-[1900px] px-5  mx-auto ${className}`}>
            {children}
        </Component>
    );
}
