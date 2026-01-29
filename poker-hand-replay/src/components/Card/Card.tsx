import type { Card as CardType } from "@/types";
import { cn } from "@/lib/utils";

interface CardProps {
    card?: CardType | null;
    hidden?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
}

export function Card({ card, hidden = false, className, size = "md" }: CardProps) {
    const sizeClasses = {
        sm: "w-10 h-14 text-xs rounded-sm",
        md: "w-14 h-20 text-base rounded",
        lg: "w-20 h-28 text-xl rounded-md",
    };

    if (hidden) {
        return (
            <div
                className={cn(
                    "bg-[#101624] border-2 border-[rgba(43,212,182,0.25)] shadow-sm flex items-center justify-center select-none",
                    sizeClasses[size],
                    className
                )}
            >
                <div className="w-1/2 h-1/2 bg-poker-hero/20 rounded-full" />
            </div>
        );
    }

    if (!card) {
        return (
            <div
                className={cn(
                    "border-2 border-dashed border-slate-700 bg-slate-800/30",
                    sizeClasses[size],
                    className
                )}
            />
        );
    }

    const isRed = card.suit === "♥" || card.suit === "♦";

    return (
        <div
            className={cn(
                "bg-slate-100 flex flex-col items-center justify-between p-[0.1em] shadow-sm select-none relative overflow-hidden",
                isRed ? "text-red-600" : "text-slate-950",
                sizeClasses[size],
                className
            )}
        >
            {/* Top Left */}
            <div className="absolute top-0.5 left-0.5 flex flex-col items-center leading-none">
                <span className="font-bold font-mono">{card.rank}</span>
                <span className="text-[0.8em]">{card.suit}</span>
            </div>

            {/* Center Suit (large) */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <span className="text-[2.5em]">{card.suit}</span>
            </div>

            {/* Bottom Right (Rotated) */}
            <div className="absolute bottom-0.5 right-0.5 flex flex-col items-center leading-none rotate-180">
                <span className="font-bold font-mono">{card.rank}</span>
                <span className="text-[0.8em]">{card.suit}</span>
            </div>
        </div>
    );
}
