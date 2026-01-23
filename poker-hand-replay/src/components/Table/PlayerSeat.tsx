import type { Player, ActionType } from "@/types";
import { Card } from "@/components/Card/Card";
import { cn } from "@/lib/utils";

interface PlayerSeatProps {
    player: Player;
    isActivePosition?: boolean;
    isDealer?: boolean;
    lastAction?: { type: ActionType; amount?: number };
    currentBet?: number;
    className?: string;
}

export function PlayerSeat({ player, isActivePosition, isDealer, lastAction, className }: PlayerSeatProps) {
    const getActionLabel = () => {
        if (!lastAction) return null;
        switch (lastAction.type) {
            case 'fold': return 'FOLD';
            case 'check': return 'CHECK';
            case 'call': return `CALL ${lastAction.amount || ''}`;
            case 'bet': return `BET ${lastAction.amount || ''}`;
            case 'raise': return `RAISE ${lastAction.amount || ''}`;
            default: return null;
        }
    };

    const actionLabel = getActionLabel();

    return (
        <div className={cn("flex flex-col items-center gap-1", className)}>
            {/* Cards */}
            <div className="relative flex -space-x-4 mb-[-10px] z-10">
                <Card card={player.cards[0]} hidden={!player.cards[0] && !player.isHero} size="sm" />
                <Card card={player.cards[1]} hidden={!player.cards[1] && !player.isHero} size="sm" />
            </div>

            {/* Avatar/Info Box */}
            <div
                className={cn(
                    "relative min-w-[100px] px-3 py-1.5 rounded-lg border flex flex-col items-center justify-center transition-all bg-slate-900",
                    isActivePosition ? "border-poker-hero shadow-[0_0_15px_-3px_rgba(6,182,212,0.5)]" : "border-slate-700",
                    !player.isActive && "opacity-50 grayscale"
                )}
            >
                {/* Dealer Button */}
                {isDealer && (
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-white text-slate-950 rounded-full flex items-center justify-center text-[10px] font-bold border border-slate-300 shadow-sm z-20">
                        D
                    </div>
                )}

                <div className="text-xs font-medium text-slate-200 truncate max-w-[90px]">
                    {player.name || player.position}
                </div>
                <div className="text-xs font-mono text-poker-pot font-bold">
                    {player.stack} BB
                </div>
            </div>

            {/* Action Label */}
            {actionLabel && (
                <div className={cn(
                    "px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide",
                    lastAction?.type === 'fold' ? "bg-red-900/50 text-red-400" :
                        lastAction?.type === 'check' ? "bg-slate-700 text-slate-300" :
                            "bg-emerald-900/50 text-emerald-400"
                )}>
                    {actionLabel}
                </div>
            )}
        </div>
    );
}
