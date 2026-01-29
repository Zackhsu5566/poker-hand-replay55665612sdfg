import type { Player, Action } from "@/types";
import { Card } from "@/components/Card/Card";
import { cn } from "@/lib/utils";
import { PokerChip } from "./PokerChip";

interface PlayerSeatProps {
    player: Player;
    isActivePosition?: boolean;
    isDealer?: boolean;
    lastAction?: Action;
    currentBet?: number;
    className?: string;
    compact?: boolean;
}

export function PlayerSeat({ player, isActivePosition, isDealer, lastAction, className, compact = false }: PlayerSeatProps) {
    const getActionLabel = () => {
        if (!lastAction) return null;
        switch (lastAction.type) {
            case 'fold': return 'FOLD';
            case 'check': return 'CHECK';
            case 'call': return `CALL ${lastAction.amount || ''}`;
            case 'bet':
                // Hide "BET" label for preflop blinds to avoid "BET 1" / "BET 2" redundancy
                if (lastAction.street === 'preflop') return null;
                return `BET ${lastAction.amount || ''}`;
            case 'raise': return `RAISE ${lastAction.amount || ''}`;
            default: return null;
        }
    };

    const actionLabel = getActionLabel();

    return (
        <div className={cn("flex flex-col items-center", compact ? "gap-0.5" : "gap-1", className)}>
            {/* Cards */}
            <div className={cn(
                "relative flex z-10",
                compact ? "-space-x-5 mb-[-8px]" : "-space-x-4 mb-[-10px]"
            )}>
                <Card card={player.cards[0]} hidden={!player.cards[0] && !player.isHero} size="sm" />
                <Card card={player.cards[1]} hidden={!player.cards[1] && !player.isHero} size="sm" />
            </div>

            {/* Avatar/Info Box */}
            <div
                className={cn(
                    "relative rounded-lg border flex flex-col items-center justify-center transition-all bg-[rgba(16,22,36,0.75)] backdrop-blur-[14px]",
                    compact
                        ? "min-w-[60px] px-1.5 py-0.5"
                        : "min-w-[72px] xs:min-w-[85px] sm:min-w-[100px] px-2 xs:px-3 py-1 xs:py-1.5",
                    isActivePosition ? "border-[rgba(43,212,182,0.35)] shadow-[0_0_15px_-3px_rgba(43,212,182,0.3)]" : "border-[rgba(255,255,255,0.10)]",
                    !player.isActive && "opacity-50 grayscale"
                )}
            >
                {/* Dealer Button */}
                {isDealer && (
                    <div className={cn(
                        "absolute bg-white text-slate-950 rounded-full flex items-center justify-center font-bold border border-slate-300 shadow-sm z-20",
                        compact ? "-top-1.5 -right-1.5 w-4 h-4 text-[8px]" : "-top-2 -right-2 w-5 h-5 text-[10px]"
                    )}>
                        D
                    </div>
                )}

                <div className={cn(
                    "font-medium text-slate-200 truncate",
                    compact ? "text-[10px] max-w-[55px]" : "text-xs max-w-[90px]"
                )}>
                    {player.name || player.position}
                </div>
                <div className={cn(
                    "flex items-center justify-center gap-1 font-mono text-poker-pot font-bold",
                    compact ? "text-[10px]" : "text-xs"
                )}>
                    <PokerChip size={compact ? 12 : 14} shadow={false} />
                    {player.stack} BB
                </div>
            </div>

            {/* Action Label */}
            {actionLabel && (
                <div className={cn(
                    "rounded font-bold uppercase tracking-wide",
                    compact ? "px-1.5 py-0.5 text-[8px]" : "px-2 py-0.5 text-[10px]",
                    lastAction?.type === 'fold' ? "bg-poker-fold/20 text-poker-fold" :
                        lastAction?.type === 'check' ? "bg-slate-700 text-slate-300" :
                            "bg-poker-bet/20 text-poker-bet"
                )}>
                    {actionLabel}
                </div>
            )}
        </div>
    );
}
