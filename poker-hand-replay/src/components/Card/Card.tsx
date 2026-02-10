import type { Card as CardType } from "@/types";
import { cn } from "@/lib/utils";

interface CardProps {
    card?: CardType | null;
    hidden?: boolean;
    className?: string;
    size?: "sm" | "md" | "lg";
    animationType?: 'deal' | 'flip' | 'none';
    animationDelay?: number;  // ms, scaled by playback speed
    animationToken?: number;  // for key-based remount to force CSS re-trigger
}

export function Card({
    card,
    hidden = false,
    className,
    size = "md",
    animationType = 'none',
    animationDelay = 0,
    animationToken = 0
}: CardProps) {
    const sizeClasses = {
        sm: "w-10 h-14 text-xs rounded-sm",
        md: "w-14 h-20 text-base rounded",
        lg: "w-20 h-28 text-xl rounded-md",
    };

    // Card back design (used in hidden state and flip animation)
    // Base: #12212C (deep blue-graphite). Motif: concentric ring (Option 1).
    const renderCardBack = () => (
        <div
            className={cn(
                "relative overflow-hidden select-none flex items-center justify-center",
                sizeClasses[size]
            )}
            style={{
                backgroundColor: '#12212C',
                boxShadow: '0 0 0 1.5px #25445B, inset 0 2px 6px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)'
            }}
        >
            {/* Inset border frame */}
            <div
                className="absolute inset-[3px] rounded-[2px] pointer-events-none"
                style={{ border: '1px solid rgba(28,52,69,0.4)' }}
            />
            {/* Center motif: embossed concentric ring */}
            <svg viewBox="0 0 24 24" className="w-[28%] aspect-square" aria-hidden="true">
                <circle cx="12" cy="12" r="10" fill="none" stroke="#1C3445" strokeWidth="1.2" opacity="0.55" />
                <circle cx="12" cy="12" r="5.5" fill="none" stroke="#1C3445" strokeWidth="0.8" opacity="0.35" />
                <circle cx="12" cy="12" r="1.2" fill="#1C3445" opacity="0.3" />
            </svg>
        </div>
    );

    // Card front design (revealed card)
    const renderCardFront = () => {
        if (!card) return null;

        const isRed = card.suit === "♥" || card.suit === "♦";

        return (
            <div
                className={cn(
                    "bg-slate-100 flex flex-col items-center justify-between p-[0.1em] shadow-sm select-none relative overflow-hidden",
                    isRed ? "text-card-suit-red" : "text-slate-950",
                    sizeClasses[size]
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
    };

    // Hidden card (static, no animation)
    if (hidden) {
        return (
            <div className={className}>
                {renderCardBack()}
            </div>
        );
    }

    // Empty placeholder
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

    // Flip animation: 3D flip with front/back faces
    if (animationType === 'flip') {
        return (
            <div
                className={cn("card-flip-container", className)}
                style={{
                    width: size === 'sm' ? '2.5rem' : size === 'lg' ? '5rem' : '3.5rem',
                    height: size === 'sm' ? '3.5rem' : size === 'lg' ? '7rem' : '5rem',
                }}
            >
                <div
                    key={`flip-${animationToken}`}
                    className="card-flip-inner animate-card-flip"
                    style={{
                        animationDelay: `${animationDelay}ms`,
                        willChange: 'transform, opacity'
                    }}
                >
                    {/* Back face */}
                    <div className="card-face card-back">
                        {renderCardBack()}
                    </div>
                    {/* Front face */}
                    <div className="card-face card-front">
                        {renderCardFront()}
                    </div>
                </div>
            </div>
        );
    }

    // Deal animation: slide in from above
    if (animationType === 'deal') {
        const isRed = card.suit === "♥" || card.suit === "♦";

        return (
            <div
                key={`deal-${animationToken}`}
                className={cn(
                    "bg-slate-100 flex flex-col items-center justify-between p-[0.1em] shadow-sm select-none relative overflow-hidden animate-card-deal",
                    isRed ? "text-card-suit-red" : "text-slate-950",
                    sizeClasses[size],
                    className
                )}
                style={{
                    animationDelay: `${animationDelay}ms`,
                    willChange: 'transform, opacity'
                }}
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

    // No animation: render card normally
    const isRed = card.suit === "♥" || card.suit === "♦";

    return (
        <div
            className={cn(
                "bg-slate-100 flex flex-col items-center justify-between p-[0.1em] shadow-sm select-none relative overflow-hidden",
                isRed ? "text-card-suit-red" : "text-slate-950",
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
