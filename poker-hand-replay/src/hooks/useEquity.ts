import { useMemo } from "react";
import type { Card, ReplaySnapshot, EquityResult, PotOdds } from "@/types";
import { calculateEquity, calculateExactEquity } from "@/utils/equity";

interface UseEquityOptions {
    enabled?: boolean;
    simulations?: number;
}

interface UseEquityResult {
    equity: EquityResult | null;
    potOdds: PotOdds | null;
}

export function useEquity(
    snapshot: ReplaySnapshot,
    options: UseEquityOptions = {}
): UseEquityResult {
    const { enabled = true, simulations = 5000 } = options;

    const equity = useMemo(() => {
        if (!enabled) return null;

        // Find hero player
        const heroPlayer = snapshot.players.find(p => p.isHero);
        if (!heroPlayer) return null;

        // Hero must have both cards
        const heroCards = heroPlayer.cards;
        if (!heroCards[0] || !heroCards[1]) return null;

        // Count active opponents (non-hero players who haven't folded)
        const activeOpponents = snapshot.players.filter(
            p => !p.isHero && p.isActive
        ).length;

        // If no opponents, hero wins by default
        if (activeOpponents === 0) {
            return {
                heroEquity: 100,
                tieEquity: 0,
                opponentCount: 0,
                simulations: 0,
            };
        }

        const communityCards = snapshot.communityCards;

        // Use exact calculation on river (5 community cards)
        if (communityCards.length === 5) {
            return calculateExactEquity(
                heroCards as [Card, Card],
                communityCards
            );
        }

        // Monte Carlo simulation for earlier streets
        return calculateEquity({
            heroCards: heroCards as [Card, Card],
            communityCards,
            opponentCount: activeOpponents,
            simulations,
        });
    }, [
        enabled,
        simulations,
        // Memoization keys - recalculate when these change
        snapshot.players.find(p => p.isHero)?.cards[0]?.rank,
        snapshot.players.find(p => p.isHero)?.cards[0]?.suit,
        snapshot.players.find(p => p.isHero)?.cards[1]?.rank,
        snapshot.players.find(p => p.isHero)?.cards[1]?.suit,
        snapshot.communityCards.length,
        snapshot.communityCards.map(c => `${c.rank}${c.suit}`).join(','),
        snapshot.players.filter(p => !p.isHero && p.isActive).length,
    ]);

    const potOdds = useMemo((): PotOdds | null => {
        if (!snapshot.lastAction) return null;

        const lastAction = snapshot.lastAction;
        const heroPlayer = snapshot.players.find(p => p.isHero);

        if (!heroPlayer) return null;

        // Only show pot odds when hero is facing a bet/raise
        // Check if the last action was a bet/raise by someone other than hero
        if (
            lastAction.playerPosition !== heroPlayer.position &&
            (lastAction.type === 'bet' || lastAction.type === 'raise' || lastAction.type === 'all-in')
        ) {
            const potSize = snapshot.pot;
            const toCall = lastAction.amount;

            // Pot odds = toCall / (pot + toCall) * 100
            const percentage = (toCall / (potSize + toCall)) * 100;
            const breakeven = percentage; // Need this equity to call profitably

            return {
                potSize,
                toCall,
                percentage: Math.round(percentage * 10) / 10,
                breakeven: Math.round(breakeven * 10) / 10,
            };
        }

        return null;
    }, [snapshot.lastAction, snapshot.pot, snapshot.players]);

    return { equity, potOdds };
}
