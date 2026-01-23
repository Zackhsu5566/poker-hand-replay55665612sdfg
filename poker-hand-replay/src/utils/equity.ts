import type { Card, EquityResult } from "@/types";
import { evaluate7Cards, compareHands, createFullDeck, cardsEqual } from "./handRanks";

export interface EquityInput {
    heroCards: [Card, Card];
    communityCards: Card[];
    opponentCount: number;
    simulations?: number;  // default 10000
}

// Fisher-Yates shuffle (in-place)
function shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Build deck excluding known cards
function buildRemainingDeck(excludeCards: Card[]): Card[] {
    const fullDeck = createFullDeck();
    return fullDeck.filter(card =>
        !excludeCards.some(excluded => cardsEqual(card, excluded))
    );
}

// Calculate equity using Monte Carlo simulation
export function calculateEquity(input: EquityInput): EquityResult {
    const { heroCards, communityCards, opponentCount, simulations = 10000 } = input;

    // If no opponents, hero has 100% equity
    if (opponentCount === 0) {
        return {
            heroEquity: 100,
            tieEquity: 0,
            opponentCount: 0,
            simulations: 0,
        };
    }

    // Known cards = hero cards + community cards
    const knownCards = [...heroCards, ...communityCards];
    const remainingDeck = buildRemainingDeck(knownCards);

    // Cards needed to complete the board (5 - current community cards)
    const boardCardsNeeded = 5 - communityCards.length;

    // Cards needed per opponent (2 hole cards each)
    const opponentCardsNeeded = opponentCount * 2;

    // Total cards needed per simulation
    const totalCardsNeeded = boardCardsNeeded + opponentCardsNeeded;

    // Check if we have enough cards
    if (remainingDeck.length < totalCardsNeeded) {
        return {
            heroEquity: 50,
            tieEquity: 0,
            opponentCount,
            simulations: 0,
        };
    }

    let heroWins = 0;
    let ties = 0;

    for (let sim = 0; sim < simulations; sim++) {
        // Shuffle remaining deck
        const shuffled = shuffleArray([...remainingDeck]);

        // Deal cards
        let cardIndex = 0;

        // Complete the community cards
        const fullBoard = [...communityCards];
        for (let i = 0; i < boardCardsNeeded; i++) {
            fullBoard.push(shuffled[cardIndex++]);
        }

        // Deal opponent hands
        const opponentHands: [Card, Card][] = [];
        for (let i = 0; i < opponentCount; i++) {
            opponentHands.push([shuffled[cardIndex++], shuffled[cardIndex++]]);
        }

        // Evaluate hero's hand
        const heroFullHand = [...heroCards, ...fullBoard];
        const heroScore = evaluate7Cards(heroFullHand);

        // Evaluate opponent hands and find best
        let heroBeatsAll = true;
        let anyTie = false;

        for (const oppHand of opponentHands) {
            const oppFullHand = [...oppHand, ...fullBoard];
            const oppScore = evaluate7Cards(oppFullHand);

            const comparison = compareHands(heroScore, oppScore);
            if (comparison < 0) {
                // Opponent wins
                heroBeatsAll = false;
                break;
            } else if (comparison === 0) {
                // Tie with this opponent
                anyTie = true;
            }
        }

        if (heroBeatsAll && !anyTie) {
            heroWins++;
        } else if (heroBeatsAll && anyTie) {
            ties++;
        }
    }

    const heroEquity = (heroWins / simulations) * 100;
    const tieEquity = (ties / simulations) * 100;

    return {
        heroEquity: Math.round(heroEquity * 10) / 10,
        tieEquity: Math.round(tieEquity * 10) / 10,
        opponentCount,
        simulations,
    };
}

// Exact equity calculation for river (all cards known)
// When board is complete, we can enumerate all possible opponent hands
export function calculateExactEquity(
    heroCards: [Card, Card],
    communityCards: Card[]
): EquityResult {
    if (communityCards.length !== 5) {
        // Fall back to Monte Carlo if not river
        return calculateEquity({
            heroCards,
            communityCards,
            opponentCount: 1,
            simulations: 10000,
        });
    }

    const knownCards = [...heroCards, ...communityCards];
    const remainingDeck = buildRemainingDeck(knownCards);

    // Hero's final hand score
    const heroScore = evaluate7Cards([...heroCards, ...communityCards]);

    let wins = 0;
    let ties = 0;
    let total = 0;

    // Enumerate all possible opponent 2-card hands
    for (let i = 0; i < remainingDeck.length - 1; i++) {
        for (let j = i + 1; j < remainingDeck.length; j++) {
            const oppHand = [remainingDeck[i], remainingDeck[j]];
            const oppScore = evaluate7Cards([...oppHand, ...communityCards]);

            total++;
            const comparison = compareHands(heroScore, oppScore);
            if (comparison > 0) {
                wins++;
            } else if (comparison === 0) {
                ties++;
            }
        }
    }

    const heroEquity = (wins / total) * 100;
    const tieEquity = (ties / total) * 100;

    return {
        heroEquity: Math.round(heroEquity * 10) / 10,
        tieEquity: Math.round(tieEquity * 10) / 10,
        opponentCount: 1,
        simulations: total,
    };
}
