import type { EquityResult, PotOdds } from "@/types";

interface EquityDisplayProps {
    equity: EquityResult;
    potOdds: PotOdds | null;
}

export function EquityDisplay({ equity, potOdds }: EquityDisplayProps) {
    // Determine equity color based on value
    const getEquityColor = (value: number): string => {
        if (value >= 65) return "bg-emerald-500";
        if (value >= 50) return "bg-cyan-500";
        if (value >= 35) return "bg-amber-500";
        return "bg-red-500";
    };

    const getEquityTextColor = (value: number): string => {
        if (value >= 65) return "text-emerald-400";
        if (value >= 50) return "text-cyan-400";
        if (value >= 35) return "text-amber-400";
        return "text-red-400";
    };

    // Compare equity to pot odds for decision indicator
    const isProfitableCall = potOdds && equity.heroEquity > potOdds.breakeven;

    return (
        <div className="bg-slate-900/90 backdrop-blur-sm border border-slate-700 rounded-lg p-3 w-28 shadow-lg">
            {/* Equity percentage - large and centered */}
            <div className="text-center mb-2">
                <div className={`text-2xl font-mono font-bold ${getEquityTextColor(equity.heroEquity)}`}>
                    {equity.heroEquity.toFixed(0)}%
                </div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                    Equity
                </div>
            </div>

            {/* Equity bar */}
            <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-2">
                <div
                    className={`h-full transition-all duration-300 ${getEquityColor(equity.heroEquity)}`}
                    style={{ width: `${equity.heroEquity}%` }}
                />
            </div>

            {/* Opponent count */}
            <div className="text-[10px] text-slate-500 text-center">
                vs {equity.opponentCount} opp{equity.opponentCount !== 1 ? 's' : ''}
            </div>

            {/* Pot odds (when facing bet) */}
            {potOdds && potOdds.toCall > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700">
                    <div className="text-center">
                        <div className="text-sm font-mono text-amber-400 font-bold">
                            {potOdds.percentage.toFixed(0)}%
                        </div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                            Pot Odds
                        </div>
                        <div className={`text-[10px] mt-1 font-medium ${isProfitableCall ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isProfitableCall ? '+EV' : '-EV'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
