import type { Card, Rank, Suite } from "@/types";

// Hand rank categories (higher = better)
export const HandRank = {
    HIGH_CARD: 1,
    PAIR: 2,
    TWO_PAIR: 3,
    THREE_OF_A_KIND: 4,
    STRAIGHT: 5,
    FLUSH: 6,
    FULL_HOUSE: 7,
    FOUR_OF_A_KIND: 8,
    STRAIGHT_FLUSH: 9,
} as const;

// Convert rank to numeric value (2-14, where A=14)
const RANK_VALUES: Record<Rank, number> = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
    '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Get numeric rank value
export function getRankValue(rank: Rank): number {
    return RANK_VALUES[rank];
}

// Evaluate a 5-card hand and return a numeric score
// Higher score = better hand
// Score format: HandRank * 10^10 + kicker encoding
function evaluate5Cards(cards: Card[]): number {
    if (cards.length !== 5) {
        throw new Error('Must evaluate exactly 5 cards');
    }

    const ranks = cards.map(c => getRankValue(c.rank)).sort((a, b) => b - a);
    const suits = cards.map(c => c.suit);

    // Check for flush
    const isFlush = suits.every(s => s === suits[0]);

    // Check for straight (including A-2-3-4-5 wheel)
    const isStraight = checkStraight(ranks);
    const straightHighCard = isStraight ? getStraightHighCard(ranks) : 0;

    // Count rank occurrences
    const rankCounts = new Map<number, number>();
    for (const r of ranks) {
        rankCounts.set(r, (rankCounts.get(r) || 0) + 1);
    }

    const counts = Array.from(rankCounts.entries())
        .sort((a, b) => {
            // Sort by count desc, then by rank desc
            if (b[1] !== a[1]) return b[1] - a[1];
            return b[0] - a[0];
        });

    // Determine hand rank
    if (isFlush && isStraight) {
        // Straight flush
        return HandRank.STRAIGHT_FLUSH * 1e10 + straightHighCard * 1e8;
    }

    if (counts[0][1] === 4) {
        // Four of a kind
        const quadRank = counts[0][0];
        const kicker = counts[1][0];
        return HandRank.FOUR_OF_A_KIND * 1e10 + quadRank * 1e8 + kicker * 1e6;
    }

    if (counts[0][1] === 3 && counts[1][1] === 2) {
        // Full house
        const tripRank = counts[0][0];
        const pairRank = counts[1][0];
        return HandRank.FULL_HOUSE * 1e10 + tripRank * 1e8 + pairRank * 1e6;
    }

    if (isFlush) {
        // Flush
        return HandRank.FLUSH * 1e10 + encodeKickers(ranks);
    }

    if (isStraight) {
        // Straight
        return HandRank.STRAIGHT * 1e10 + straightHighCard * 1e8;
    }

    if (counts[0][1] === 3) {
        // Three of a kind
        const tripRank = counts[0][0];
        const kickers = counts.slice(1).map(c => c[0]);
        return HandRank.THREE_OF_A_KIND * 1e10 + tripRank * 1e8 + encodeKickers(kickers);
    }

    if (counts[0][1] === 2 && counts[1][1] === 2) {
        // Two pair
        const highPair = Math.max(counts[0][0], counts[1][0]);
        const lowPair = Math.min(counts[0][0], counts[1][0]);
        const kicker = counts[2][0];
        return HandRank.TWO_PAIR * 1e10 + highPair * 1e8 + lowPair * 1e6 + kicker * 1e4;
    }

    if (counts[0][1] === 2) {
        // One pair
        const pairRank = counts[0][0];
        const kickers = counts.slice(1).map(c => c[0]);
        return HandRank.PAIR * 1e10 + pairRank * 1e8 + encodeKickers(kickers);
    }

    // High card
    return HandRank.HIGH_CARD * 1e10 + encodeKickers(ranks);
}

// Check if sorted ranks form a straight
function checkStraight(sortedRanks: number[]): boolean {
    // Normal straight check
    const isNormalStraight = sortedRanks[0] - sortedRanks[4] === 4 &&
        new Set(sortedRanks).size === 5;

    // Wheel (A-2-3-4-5) check
    const isWheel = sortedRanks[0] === 14 &&
        sortedRanks[1] === 5 &&
        sortedRanks[2] === 4 &&
        sortedRanks[3] === 3 &&
        sortedRanks[4] === 2;

    return isNormalStraight || isWheel;
}

// Get the high card of a straight (5 for wheel)
function getStraightHighCard(sortedRanks: number[]): number {
    // Wheel (A-2-3-4-5)
    if (sortedRanks[0] === 14 && sortedRanks[1] === 5) {
        return 5; // 5-high straight
    }
    return sortedRanks[0];
}

// Encode kickers into a single number for comparison
function encodeKickers(kickers: number[]): number {
    let result = 0;
    for (let i = 0; i < kickers.length && i < 5; i++) {
        result += kickers[i] * Math.pow(100, 4 - i);
    }
    return result;
}

// Generate all 21 combinations of 5 cards from 7 cards
function* combinations5from7(cards: Card[]): Generator<Card[]> {
    if (cards.length < 5) return;

    for (let i = 0; i < cards.length - 4; i++) {
        for (let j = i + 1; j < cards.length - 3; j++) {
            for (let k = j + 1; k < cards.length - 2; k++) {
                for (let l = k + 1; l < cards.length - 1; l++) {
                    for (let m = l + 1; m < cards.length; m++) {
                        yield [cards[i], cards[j], cards[k], cards[l], cards[m]];
                    }
                }
            }
        }
    }
}

// Evaluate the best 5-card hand from 7 cards
export function evaluate7Cards(cards: Card[]): number {
    if (cards.length < 5) {
        throw new Error('Need at least 5 cards to evaluate');
    }

    if (cards.length === 5) {
        return evaluate5Cards(cards);
    }

    let bestScore = 0;
    for (const combo of combinations5from7(cards)) {
        const score = evaluate5Cards(combo);
        if (score > bestScore) {
            bestScore = score;
        }
    }
    return bestScore;
}

// Compare two hand scores: returns 1 if a wins, -1 if b wins, 0 if tie
export function compareHands(a: number, b: number): number {
    if (a > b) return 1;
    if (a < b) return -1;
    return 0;
}

// Full deck of 52 cards
export function createFullDeck(): Card[] {
    const suits: Suite[] = ['♠', '♥', '♦', '♣'];
    const ranks: Rank[] = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'];
    const deck: Card[] = [];

    for (const suit of suits) {
        for (const rank of ranks) {
            deck.push({ rank, suit });
        }
    }
    return deck;
}

// Check if two cards are the same
export function cardsEqual(a: Card, b: Card): boolean {
    return a.rank === b.rank && a.suit === b.suit;
}
